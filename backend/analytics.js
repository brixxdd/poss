const { Pool } = require('pg');
const { SimpleLinearRegression } = require('ml-regression');
const axios = require('axios');

// Configuración del servicio ML
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';
const ML_SERVICE_ENABLED = process.env.ML_SERVICE_ENABLED === 'true';
const ML_SERVICE_TIMEOUT = parseInt(process.env.ML_SERVICE_TIMEOUT || '30000', 10);

/**
 * Calcula el promedio móvil simple (SMA)
 * CORRECCIÓN: Ahora usa ventana adaptativa cuando hay menos datos que windowSize
 * Si hay 3 días de datos pero windowSize=7, promedia los 3 días disponibles
 * Esto evita sesgos hacia el último día en productos nuevos
 */
function calculateMovingAverage(data, windowSize) {
    if (data.length === 0) return 0;

    // Usar ventana adaptativa: min(datos disponibles, windowSize deseado)
    const effectiveWindow = Math.min(data.length, windowSize);
    const window = data.slice(-effectiveWindow);
    const sum = window.reduce((acc, val) => acc + val, 0);
    return sum / effectiveWindow;
}

/**
 * Obtiene el historial de ventas para predicción, incluyendo días sin ventas (como 0)
 * CORRECCIÓN: Ahora incluye TODOS los días, incluso aquellos sin ventas
 * Esto es crítico para:
 * - Moving Average: Calcular promedios reales
 * - Linear Regression: Ver patrones reales incluyendo días sin actividad
 * - Consistencia: Siempre retorna exactamente N días de datos
 */
async function getSalesHistoryForPrediction(pool, productId, days = 90) {
    const query = `
        WITH date_range AS (
            SELECT generate_series(
                CURRENT_DATE - INTERVAL '${days} days',
                CURRENT_DATE - INTERVAL '1 day',
                INTERVAL '1 day'
            )::date AS day
        )
        SELECT
            dr.day,
            COALESCE(SUM(si.quantity), 0)::int AS qty
        FROM date_range dr
        LEFT JOIN sales s ON DATE(s.sale_date) = dr.day
        LEFT JOIN sale_items si ON si.sale_id = s.id AND si.product_id = $1
        GROUP BY dr.day
        ORDER BY dr.day ASC;
    `;
    const result = await pool.query(query, [productId]);
    return result.rows.map(row => row.qty);
}

async function getProductDetails(pool, productId) {
    const query = `SELECT id, name FROM products WHERE id = $1`;
    const result = await pool.query(query, [productId]);
    return result.rows[0];
}

/**
 * Llama al servicio ML de Prophet para generar predicciones avanzadas
 * @param {string} productId - ID del producto
 * @param {string} productName - Nombre del producto
 * @param {Array} historicalSales - Array de {ds: fecha, y: cantidad}
 * @param {number} horizonDays - Días a predecir
 * @returns {Promise<Object>} Predicción con intervalos de confianza
 */
async function callProphetService(productId, productName, historicalSales, horizonDays = 7) {
    try {
        console.log(`📡 Llamando al servicio ML Prophet para producto: ${productName}`);

        const response = await axios.post(
            `${ML_SERVICE_URL}/predict`,
            {
                product_id: productId,
                product_name: productName,
                historical_sales: historicalSales,
                horizon_days: horizonDays,
                confidence_interval: 0.95
            },
            {
                timeout: ML_SERVICE_TIMEOUT,
                headers: { 'Content-Type': 'application/json' }
            }
        );

        console.log(`✅ Prophet respondió exitosamente para ${productName}`);
        return response.data;

    } catch (error) {
        if (error.code === 'ECONNREFUSED') {
            console.error(`❌ Servicio ML no disponible en ${ML_SERVICE_URL}`);
            throw new Error('ML_SERVICE_UNAVAILABLE');
        } else if (error.response) {
            console.error(`❌ Error del servicio ML: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
            throw new Error(`ML_SERVICE_ERROR: ${error.response.data.detail || 'Unknown error'}`);
        } else {
            console.error(`❌ Error llamando al servicio ML: ${error.message}`);
            throw error;
        }
    }
}

/**
 * Calcula el promedio diario de ventas sobre TODOS los días (incluyendo días sin ventas)
 * CORRECCIÓN: Ahora divide entre días totales del período, no solo días con ventas
 * Esto asegura:
 * - Consistencia con getSalesHistoryForPrediction
 * - Promedio real considerando días festivos/cerrados
 * - Predicciones de alertas más realistas
 *
 * @returns {Object} { avg: number, actualDays: number }
 */
async function getAvgDailySales(pool, productId, days = 90) {
    // Query para obtener promedio Y días reales disponibles
    const query = `
        SELECT
            COALESCE(SUM(quantity)::float / $2, 0) AS avg_daily_sales,
            COUNT(DISTINCT DATE(sale_date)) AS actual_days_with_sales,
            GREATEST(
                CURRENT_DATE - MIN(DATE(sale_date))::date + 1,
                1
            ) AS actual_days_in_range
        FROM sale_items
        JOIN sales ON sales.id = sale_items.sale_id
        WHERE product_id = $1 AND sale_date >= NOW() - INTERVAL '${days} days'::interval
    `;
    const result = await pool.query(query, [productId, days]);

    const row = result.rows[0];
    const avg = parseFloat(row?.avg_daily_sales || 0);
    const actualDays = parseInt(row?.actual_days_in_range || days);

    return { avg, actualDays };
}

async function runStockAlerts(pool) {
    const ALERT_DAYS_THRESHOLD = parseInt(process.env.ALERT_DAYS_THRESHOLD || '7', 10);
    const AVG_SALES_WINDOW_DAYS = parseInt(process.env.AVG_SALES_WINDOW_DAYS || '90', 10);

    const productsResult = await pool.query('SELECT id, name, stock, reorder_threshold FROM products');
    const products = productsResult.rows;

    let alertsCreated = 0;
    for (const product of products) {
        const { avg: avgDailySales } = await getAvgDailySales(pool, product.id, AVG_SALES_WINDOW_DAYS);
        const currentStock = product.stock;
        const reorderThreshold = product.reorder_threshold;

        let daysUntilStockout = Infinity;
        if (avgDailySales > 0) {
            daysUntilStockout = Math.floor(currentStock / avgDailySales);
        }

        let severity = 0;
        let alertType = null;
        let predictedOutDate = null;

        if (currentStock <= reorderThreshold) {
            alertType = 'low_stock';
            severity = 3; // High severity for immediate low stock
        } else if (daysUntilStockout <= ALERT_DAYS_THRESHOLD) {
            alertType = 'will_stockout';
            severity = daysUntilStockout <= 1 ? 3 : (daysUntilStockout <= 3 ? 2 : 1);
            predictedOutDate = new Date();
            predictedOutDate.setDate(predictedOutDate.getDate() + daysUntilStockout);
        }

        if (alertType) {
            // Check if an identical alert already exists and is not resolved
            const existingAlertQuery = `
                SELECT id FROM stock_alerts
                WHERE product_id = $1 AND alert_type = $2 AND severity = $3 AND resolved = FALSE
                AND (predicted_out_date IS NOT DISTINCT FROM $4)
                AND (days_until_stockout IS NOT DISTINCT FROM $5)
            `;
            const existingAlertResult = await pool.query(existingAlertQuery, [
                product.id, alertType, severity, predictedOutDate, daysUntilStockout
            ]);

            if (existingAlertResult.rows.length === 0) {
                const insertAlertQuery = `
                    INSERT INTO stock_alerts (product_id, alert_type, severity, predicted_out_date, days_until_stockout)
                    VALUES ($1, $2, $3, $4, $5)
                `;
                await pool.query(insertAlertQuery, [
                    product.id, alertType, severity, predictedOutDate, daysUntilStockout
                ]);
                alertsCreated++;
            }
        }
    }
    return { status: 'ok', alerts_created: alertsCreated };
}

async function getBestModelForProduct(pool, productId) {
    const query = `
        SELECT model_version, mae, rmse
        FROM model_metrics
        WHERE product_id = $1
        ORDER BY mae ASC, evaluated_at DESC
        LIMIT 1;
    `;
    const result = await pool.query(query, [productId]);
    return result.rows[0];
}

/**
 * Ejecuta todos los modelos clásicos y retorna sus predicciones
 * @param {Pool} pool - PostgreSQL pool
 * @param {number} productId - ID del producto
 * @param {Array} historicalSalesValues - Array de valores históricos
 * @param {number} horizonDays - Días a predecir
 * @returns {Object} - Objeto con predicciones de cada modelo
 */
async function runAllClassicModels(pool, productId, historicalSalesValues, horizonDays) {
    const models = {};

    // 1. MOVING AVERAGE
    try {
        const windowSize = parseInt(process.env.PREDICTION_MA_WINDOW || '7', 10);
        const effectiveWindow = Math.min(historicalSalesValues.length, windowSize);
        const lastValue = calculateMovingAverage(historicalSalesValues, windowSize);
        const predictedDaily = [];
        for (let i = 0; i < horizonDays; i++) {
            predictedDaily.push(Math.max(0, Math.round(lastValue)));
        }

        console.log(`   📊 Moving Average:`);
        console.log(`      Ventana: ${effectiveWindow} días (de últimos ${historicalSalesValues.length} disponibles)`);
        const recentValues = historicalSalesValues.slice(-effectiveWindow);
        console.log(`      Valores recientes: [${recentValues.join(', ')}]`);
        console.log(`      Promedio calculado: ${lastValue.toFixed(2)} u/día`);
        console.log(`      Predicción: ${Math.round(lastValue)} u/día × ${horizonDays} días = ${predictedDaily.reduce((s,v)=>s+v,0)} unidades\n`);

        models.moving_average_v1 = {
            predicted_daily: predictedDaily,
            predicted_total: predictedDaily.reduce((sum, val) => sum + val, 0),
            params: { window: effectiveWindow, avg: lastValue }
        };
    } catch (error) {
        console.error(`      ❌ Error ejecutando moving_average: ${error.message}`);
    }

    // 2. LINEAR REGRESSION
    try {
        if (historicalSalesValues.length >= 2) {
            const x = historicalSalesValues.map((_, i) => i);
            const y = historicalSalesValues;
            const regression = new SimpleLinearRegression(x, y);
            const predictedDaily = [];
            for (let i = 0; i < horizonDays; i++) {
                const nextDayIndex = historicalSalesValues.length + i;
                const prediction = regression.predict(nextDayIndex);
                predictedDaily.push(Math.max(0, Math.round(prediction)));
            }

            const slope = regression.slope;
            const trendEmoji = slope > 0.5 ? '📈 Creciente' : slope < -0.5 ? '📉 Decreciente' : '➡️ Estable';

            console.log(`   📐 Linear Regression:`);
            console.log(`      Pendiente: ${slope.toFixed(4)} (${trendEmoji})`);
            console.log(`      Intercepto: ${regression.intercept.toFixed(2)}`);
            console.log(`      Datos usados: ${historicalSalesValues.length} días`);
            console.log(`      Predicción días 1-${horizonDays}: [${predictedDaily.join(', ')}]`);
            console.log(`      Total: ${predictedDaily.reduce((s,v)=>s+v,0)} unidades\n`);

            models.linear_regression_v1 = {
                predicted_daily: predictedDaily,
                predicted_total: predictedDaily.reduce((sum, val) => sum + val, 0),
                params: { slope: regression.slope, intercept: regression.intercept }
            };
        }
    } catch (error) {
        console.error(`      ❌ Error ejecutando linear_regression: ${error.message}`);
    }

    // 3. BASELINE AVERAGE
    try {
        const { avg: avgDailySales, actualDays } = await getAvgDailySales(pool, productId, 90);
        const predictedDaily = [];
        for (let i = 0; i < horizonDays; i++) {
            predictedDaily.push(Math.max(0, Math.round(avgDailySales)));
        }

        console.log(`   📊 Baseline Average (Promedio Histórico):`);
        console.log(`      Período solicitado: Últimos 90 días`);
        console.log(`      Período real analizado: ${actualDays} días (datos disponibles)`);
        console.log(`      Promedio calculado: ${avgDailySales.toFixed(2)} u/día`);
        console.log(`      Predicción constante: ${Math.round(avgDailySales)} u/día`);
        console.log(`      Total: ${predictedDaily.reduce((s,v)=>s+v,0)} unidades\n`);

        models.baseline_avg_v1 = {
            predicted_daily: predictedDaily,
            predicted_total: predictedDaily.reduce((sum, val) => sum + val, 0),
            params: { avg: avgDailySales, actualDays }
        };
    } catch (error) {
        console.error(`      ❌ Error ejecutando baseline_avg: ${error.message}`);
    }

    return models;
}

/**
 * Selecciona el mejor modelo clásico basándose en métricas históricas
 * @param {Pool} pool - PostgreSQL pool
 * @param {number} productId - ID del producto
 * @param {Object} availableModels - Modelos disponibles para elegir
 * @returns {string} - Nombre del mejor modelo
 */
async function selectBestClassicModel(pool, productId, availableModels) {
    // Obtener TODAS las métricas de todos los modelos para este producto
    const allMetricsQuery = `
        SELECT model_version, mae, rmse, evaluated_at
        FROM model_metrics
        WHERE product_id = $1
        ORDER BY mae ASC, evaluated_at DESC;
    `;

    const metricsResult = await pool.query(allMetricsQuery, [productId]);
    const allMetrics = metricsResult.rows;

    if (allMetrics.length > 0) {
        console.log(`\n🏆 COMPETENCIA DE MODELOS (basada en métricas históricas):`);
        console.log(`${'─'.repeat(80)}`);
        console.log(`   Modelo                    | MAE      | RMSE     | Evaluado`);
        console.log(`${'─'.repeat(80)}`);

        allMetrics.forEach((metric, idx) => {
            const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '  ';
            const modelName = metric.model_version.padEnd(25);
            const mae = metric.mae.toFixed(2).padStart(8);
            const rmse = metric.rmse.toFixed(2).padStart(8);
            const date = new Date(metric.evaluated_at).toLocaleDateString();

            console.log(`${medal} ${modelName} | ${mae} | ${rmse} | ${date}`);
        });

        console.log(`${'─'.repeat(80)}`);

        // Seleccionar el mejor (menor MAE) que esté disponible
        const bestMetric = allMetrics.find(m => availableModels[m.model_version]);

        if (bestMetric) {
            console.log(`\n✅ GANADOR: ${bestMetric.model_version} (MAE: ${bestMetric.mae.toFixed(2)})\n`);
            return bestMetric.model_version;
        }
    }

    // Si no hay métricas, usar moving_average por defecto (más conservador)
    console.log(`\n⚠️  Sin métricas históricas disponibles`);
    console.log(`   Usando moving_average_v1 por defecto (modelo conservador)\n`);
    return 'moving_average_v1';
}

async function getSalesPrediction(pool, productId, horizonDays = 7, method = 'auto') {
    const product = await getProductDetails(pool, productId);
    if (!product) {
        throw new Error('Product not found');
    }

    console.log(`\n${'='.repeat(80)}`);
    console.log(`🎯 INICIANDO PREDICCIÓN PARA: ${product.name}`);
    console.log(`${'='.repeat(80)}`);

    // Obtener datos históricos
    const query = `
        SELECT
            DATE(sale_date) AS ds,
            SUM(quantity)::int AS y
        FROM sale_items
        JOIN sales ON sales.id = sale_items.sale_id
        WHERE product_id = $1 AND sale_date >= NOW() - INTERVAL '90 days'
        GROUP BY DATE(sale_date)
        ORDER BY ds ASC;
    `;
    const result = await pool.query(query, [productId]);
    const historicalSales = result.rows.map(row => ({
        ds: row.ds.toISOString().split('T')[0],
        y: row.y
    }));

    const daysOfData = historicalSales.length;
    console.log(`📅 Días de datos históricos disponibles: ${daysOfData}`);

    // ESTRATEGIA DE SELECCIÓN DE MODELO BASADA EN CANTIDAD DE DATOS
    const PROPHET_THRESHOLD = 40; // Mínimo 40 días (~6 semanas) para patrones más estables

    // ==================== ESCENARIO 1: 24+ DÍAS - PROPHET DOMINANTE ====================
    if (daysOfData >= PROPHET_THRESHOLD && ML_SERVICE_ENABLED && (method === 'auto' || method === 'prophet')) {
        console.log(`\n🤖 ESTRATEGIA: Prophet dominante (≥${PROPHET_THRESHOLD} días de datos)`);
        console.log(`${'─'.repeat(80)}`);

        try {
            console.log(`🔄 Llamando al servicio Prophet...`);

            if (historicalSales.length >= PROPHET_THRESHOLD) {
                // Llamar al servicio Prophet
                const prophetResponse = await callProphetService(
                    productId,
                    product.name,
                    historicalSales,
                    horizonDays
                );

                // Convertir respuesta de Prophet al formato esperado
                const predictedDaily = prophetResponse.predictions.map(p => p.prediction);
                const predictedTotal = predictedDaily.reduce((sum, val) => sum + val, 0);

                // LOGS DETALLADOS: Mostrar intervalos de confianza
                console.log(`\n📊 PREDICCIÓN DETALLADA PROPHET`);
                console.log(`${'─'.repeat(80)}`);
                console.log(`Modelo: ${prophetResponse.model}`);
                console.log(`Intervalo de confianza: 95%`);
                console.log(`Datos históricos usados: ${historicalSales.length} días`);
                console.log(`\nPredicciones diarias (próximos ${horizonDays} días):`);
                console.log(`${'─'.repeat(80)}`);

                prophetResponse.predictions.forEach((pred, index) => {
                    const dayNum = index + 1;
                    const date = pred.date;
                    const lower = pred.lower_bound.toFixed(2);
                    const prediction = pred.prediction.toFixed(2);
                    const upper = pred.upper_bound.toFixed(2);
                    const uncertainty = ((pred.upper_bound - pred.lower_bound) / 2).toFixed(2);

                    console.log(`Día ${dayNum} (${date}): ${prediction} u. [${lower}-${upper}] ±${uncertainty}`);
                });

                console.log(`${'─'.repeat(80)}`);
                console.log(`TOTAL: ${predictedTotal.toFixed(2)} unidades | Promedio: ${(predictedTotal / horizonDays).toFixed(2)} u/día`);
                console.log(`${'='.repeat(80)}\n`);

                // Guardar en BD
                try {
                    const insertPredictionQuery = `
                        INSERT INTO sales_predictions (product_id, horizon_days, predicted_qty, prediction_date, model_version)
                        VALUES ($1, $2, $3, $4, $5)
                        ON CONFLICT (product_id, prediction_date, model_version) DO UPDATE SET
                        predicted_qty = EXCLUDED.predicted_qty, horizon_days = EXCLUDED.horizon_days, created_at = NOW();
                    `;
                    await pool.query(insertPredictionQuery, [
                        productId,
                        horizonDays,
                        Math.round(predictedTotal),
                        new Date(),
                        prophetResponse.model
                    ]);
                    console.log(`✅ Predicción Prophet guardada en BD`);
                } catch (dbError) {
                    console.error(`❌ Error al guardar predicción Prophet: ${dbError.message}`);
                }

                // Retornar respuesta en formato enriquecido con Prophet
                return {
                    product_id: productId,
                    product_name: product.name,
                    horizon_days: horizonDays,
                    predicted_total: predictedTotal,
                    predicted_daily: predictedDaily,
                    model_version: prophetResponse.model,
                    model_params: {},
                    computed_at: new Date().toISOString(),
                    prophet_data: {
                        confidence_intervals: prophetResponse.predictions.map(p => ({
                            date: p.date,
                            lower: p.lower_bound,
                            upper: p.upper_bound
                        })),
                        metadata: prophetResponse.metadata
                    }
                };
            }
        } catch (error) {
            if (error.message === 'ML_SERVICE_UNAVAILABLE') {
                console.log('⚠️  Servicio ML no disponible, usando métodos clásicos como fallback');
            } else {
                console.error(`❌ Error usando Prophet: ${error.message}`);
                console.log('🔄 Fallback a métodos clásicos...');
            }
            // Continuar con métodos clásicos (fallback)
        }
    }

    // ==================== ESCENARIO 2: 0-23 DÍAS - COMPETENCIA DE MODELOS CLÁSICOS ====================
    console.log(`\n📊 ESTRATEGIA: Competencia de modelos clásicos (<${PROPHET_THRESHOLD} días de datos)`);
    console.log(`${'─'.repeat(80)}`);

    // Obtener valores históricos
    const salesHistory = await getSalesHistoryForPrediction(pool, productId, 90);
    const historicalSalesValues = salesHistory.map(s => s);

    // Ejecutar TODOS los modelos clásicos
    console.log(`🔄 Ejecutando todos los modelos clásicos...`);
    const allModels = await runAllClassicModels(pool, productId, historicalSalesValues, horizonDays);

    // Mostrar predicciones de todos los modelos
    console.log(`\n📈 PREDICCIONES DE CADA MODELO:`);
    console.log(`${'─'.repeat(80)}`);
    for (const [modelName, modelData] of Object.entries(allModels)) {
        console.log(`${modelName}:`);
        console.log(`  Total: ${modelData.predicted_total} unidades`);
        console.log(`  Promedio diario: ${(modelData.predicted_total / horizonDays).toFixed(2)} u/día`);
        console.log(`  Parámetros: ${JSON.stringify(modelData.params)}`);
    }
    console.log(`${'─'.repeat(80)}`);

    // Seleccionar el mejor modelo basado en métricas históricas
    const selectedModelName = await selectBestClassicModel(pool, productId, allModels);
    const selectedModel = allModels[selectedModelName];

    if (!selectedModel) {
        throw new Error(`Modelo seleccionado ${selectedModelName} no está disponible`);
    }

    console.log(`\n✅ MODELO SELECCIONADO: ${selectedModelName}`);
    console.log(`   Total predicho: ${selectedModel.predicted_total} unidades`);
    console.log(`   Promedio diario: ${(selectedModel.predicted_total / horizonDays).toFixed(2)} u/día`);
    console.log(`${'='.repeat(80)}\n`);

    const predictedDaily = selectedModel.predicted_daily;
    const predictedTotal = selectedModel.predicted_total;
    const modelVersion = selectedModelName;
    const modelParams = selectedModel.params;

    // Guardar predicción en BD
    try {
        const insertPredictionQuery = `
            INSERT INTO sales_predictions (product_id, horizon_days, predicted_qty, prediction_date, model_version)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (product_id, prediction_date, model_version) DO UPDATE SET
            predicted_qty = EXCLUDED.predicted_qty, horizon_days = EXCLUDED.horizon_days, created_at = NOW();
        `;
        await pool.query(insertPredictionQuery, [
            productId,
            horizonDays,
            predictedTotal,
            new Date(),
            modelVersion
        ]);
        console.log(`✅ Predicción ${modelVersion} guardada en BD`);
    } catch (dbError) {
        console.error(`❌ Error al guardar predicción: ${dbError.message}`);
    }

    return {
        product_id: productId,
        product_name: product.name,
        horizon_days: horizonDays,
        predicted_total: predictedTotal,
        predicted_daily: predictedDaily,
        model_version: modelVersion,
        model_params: modelParams,
        computed_at: new Date().toISOString()
    };
}

async function getTopProducts(pool, rangeDays = 30, limit = 10) {
    const query = `
        SELECT
            p.id AS product_id,
            p.name AS product_name,
            SUM(si.quantity)::int AS total_qty_sold
        FROM sale_items si
        JOIN sales s ON si.sale_id = s.id
        JOIN products p ON si.product_id = p.id
        WHERE s.sale_date >= NOW() - INTERVAL '${rangeDays} days'::interval
        GROUP BY p.id, p.name
        ORDER BY total_qty_sold DESC
        LIMIT $1;
    `;
    const result = await pool.query(query, [limit]);
    return result.rows;
}

/**
 * Obtiene el total de ventas del día actual
 * CORRECCIÓN DEFINITIVA: Convierte timestamps a zona horaria local antes de comparar
 * Usa fecha del servidor Node.js (zona horaria local) en lugar de CURRENT_DATE de PostgreSQL
 */
async function getTotalSalesToday(pool) {
    // Obtener fecha actual en zona horaria local del servidor Node.js
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    const query = `
        SELECT COALESCE(SUM(total_amount), 0)::float AS total_sales
        FROM sales
        WHERE DATE(sale_date AT TIME ZONE 'UTC' AT TIME ZONE 'America/Mexico_City') = $1::date;
    `;
    const result = await pool.query(query, [today]);
    return result.rows[0]?.total_sales || 0;
}

/**
 * Calcula el promedio de ventas diarias en un rango de días
 * CORRECCIÓN DEFINITIVA: Convierte timestamps a zona horaria local
 */
async function getAvgDailySalesForRange(pool, rangeDays = 7) {
    // Obtener fecha actual en zona horaria local
    const today = new Date().toISOString().split('T')[0];

    const query = `
        SELECT COALESCE(AVG(daily_total), 0)::float AS average_daily_sales
        FROM (
            SELECT
                DATE(sale_date AT TIME ZONE 'UTC' AT TIME ZONE 'America/Mexico_City') AS sale_day,
                SUM(total_amount)::float AS daily_total
            FROM sales
            WHERE DATE(sale_date AT TIME ZONE 'UTC' AT TIME ZONE 'America/Mexico_City') >= $1::date - INTERVAL '${rangeDays} days'
                AND DATE(sale_date AT TIME ZONE 'UTC' AT TIME ZONE 'America/Mexico_City') <= $1::date
            GROUP BY DATE(sale_date AT TIME ZONE 'UTC' AT TIME ZONE 'America/Mexico_City')
        ) AS daily_sales;
    `;
    const result = await pool.query(query, [today]);
    return result.rows[0]?.average_daily_sales || 0;
}

async function evaluateSalesPredictions(pool) {
    console.log('Iniciando evaluación de predicciones de ventas...');

    // CORRECCIÓN: Obtener predicciones hechas hace 7-14 días para compararlas con ventas reales de hoy
    const evaluationQuery = `
        SELECT
            sp.id,
            sp.product_id,
            sp.prediction_date,
            sp.predicted_qty,
            sp.model_version,
            sp.horizon_days,
            sp.created_at,
            p.name as product_name
        FROM sales_predictions sp
        JOIN products p ON sp.product_id = p.id
        WHERE sp.prediction_date >= CURRENT_DATE - INTERVAL '14 days'
          AND sp.prediction_date <= CURRENT_DATE
        ORDER BY sp.product_id, sp.prediction_date;
    `;

    const predictionsResult = await pool.query(evaluationQuery);
    const oldPredictions = predictionsResult.rows;

    if (oldPredictions.length === 0) {
        console.log('No hay predicciones pasadas para evaluar.');
        return { status: 'ok', message: 'No hay predicciones pasadas para evaluar.' };
    }

    let evaluationsCount = 0;
    const metricsByModel = {}; // Agrupar por modelo

    for (const pred of oldPredictions) {
        // Obtener ventas REALES del día que se predijo
        const actualSalesQuery = `
            SELECT COALESCE(SUM(quantity), 0)::int as actual_qty
            FROM sale_items si
            JOIN sales s ON si.sale_id = s.id
            WHERE si.product_id = $1
              AND DATE(s.sale_date) = $2;
        `;

        const actualResult = await pool.query(actualSalesQuery, [pred.product_id, pred.prediction_date]);
        const actualQty = actualResult.rows[0]?.actual_qty || 0;

        // Calcular error
        const error = actualQty - pred.predicted_qty;
        const absError = Math.abs(error);
        const sqError = error * error;

        // Agrupar por modelo + producto + horizonte
        const key = `${pred.model_version}|${pred.product_id}|${pred.horizon_days}`;

        if (!metricsByModel[key]) {
            metricsByModel[key] = {
                model_version: pred.model_version,
                product_id: pred.product_id,
                product_name: pred.product_name,
                horizon: pred.horizon_days,
                errors: [],
                sqErrors: []
            };
        }

        metricsByModel[key].errors.push(absError);
        metricsByModel[key].sqErrors.push(sqError);
    }

    // Calcular MAE y RMSE por modelo
    for (const key in metricsByModel) {
        const data = metricsByModel[key];
        const n = data.errors.length;

        if (n === 0) continue;

        const mae = data.errors.reduce((a, b) => a + b, 0) / n;
        const rmse = Math.sqrt(data.sqErrors.reduce((a, b) => a + b, 0) / n);

        const insertMetricsQuery = `
            INSERT INTO model_metrics (model_version, product_id, horizon, mae, rmse)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (product_id, model_version, horizon, evaluated_at) DO NOTHING;
        `;

        await pool.query(insertMetricsQuery, [
            data.model_version,
            data.product_id,
            data.horizon,
            mae,
            rmse
        ]);

        console.log(`✅ Métricas para ${data.product_name} (${data.model_version}, ${data.horizon}d): MAE=${mae.toFixed(2)}, RMSE=${rmse.toFixed(2)} (${n} predicciones evaluadas)`);
        evaluationsCount++;
    }

    console.log(`Evaluación de predicciones finalizada. ${evaluationsCount} modelos evaluados.`);
    return {
        status: 'ok',
        message: `Evaluación de predicciones finalizada. ${evaluationsCount} modelos evaluados.`,
        evaluations_count: evaluationsCount
    };
}

// Helper functions removed - evaluateSalesPredictions now handles everything inline

async function getModelMetrics(pool) {
    const query = `
        SELECT DISTINCT ON (product_id, model_version, horizon)
            product_id,
            p.name as product_name,
            model_version,
            horizon,
            mae,
            rmse,
            evaluated_at
        FROM model_metrics
        JOIN products p ON p.id = model_metrics.product_id
        ORDER BY product_id, model_version, horizon, evaluated_at DESC;
    `;
    const result = await pool.query(query);
    return result.rows;
}

module.exports = {
    runStockAlerts,
    getSalesPrediction,
    getSalesHistoryForPrediction,
    getTopProducts,
    getTotalSalesToday,
    getAvgDailySalesForRange,
    evaluateSalesPredictions,
    getModelMetrics
};

