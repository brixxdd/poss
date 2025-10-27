/**
 * INTEGRACIÓN WHATSAPP VÍA N8N
 *
 * Este módulo maneja las peticiones desde el flujo de N8N
 * para responder consultas del admin vía WhatsApp.
 *
 * Acciones disponibles:
 * - menu: Mostrar opciones disponibles
 * - promedio_7_dias: Promedio de ventas últimos 7 días
 * - total_ventas_dia: Total de ventas de hoy
 * - alertas: Alertas de stock crítico
 * - top_5_productos: Top 5 productos más vendidos
 */

const { getAvgDailySalesForRange, getTotalSalesToday, getTopProducts } = require('./analytics');

/**
 * Valida si un número de WhatsApp está autorizado para usar el bot
 * @param {Pool} pool - Conexión a PostgreSQL
 * @param {string} whatsappNumber - Número de WhatsApp (ej: 5219622566515)
 * @returns {Promise<boolean>} True si está autorizado, false si no
 */
async function isWhatsAppNumberAuthorized(pool, whatsappNumber) {
    if (!whatsappNumber) {
        console.log('⚠️  No se proporcionó número de WhatsApp');
        return false;
    }

    try {
        const query = `
            SELECT id, name, active
            FROM whatsapp_admins
            WHERE whatsapp_number = $1 AND active = true
        `;
        const result = await pool.query(query, [whatsappNumber]);

        if (result.rows.length > 0) {
            console.log(`✅ Número autorizado: ${result.rows[0].name || whatsappNumber}`);
            return true;
        } else {
            console.log(`❌ Número NO autorizado: ${whatsappNumber}`);
            return false;
        }
    } catch (error) {
        console.error('❌ Error validando número de WhatsApp:', error);
        return false;
    }
}

/**
 * Procesa la acción solicitada y retorna la respuesta apropiada
 * @param {Pool} pool - Conexión a PostgreSQL
 * @param {string} action - Acción solicitada
 * @param {string} userId - ID del usuario de WhatsApp
 * @returns {Promise<Object>} Respuesta con los datos solicitados
 */
async function processWhatsAppAction(pool, action, userId) {
    console.log(`📱 WhatsApp Bot - Acción: ${action}, Usuario: ${userId}`);

    try {
        switch (action) {
            case 'menu':
                return {
                    action: 'menu',
                    response: {
                        type: 'menu',
                        options: [
                            { number: 1, text: 'Ver menú de opciones' },
                            { number: 2, text: 'Promedio de ventas (últimos 7 días)' },
                            { number: 3, text: 'Total de ventas hoy' },
                            { number: 4, text: 'Alertas de stock crítico' },
                            { number: 5, text: 'Top 5 productos más vendidos' }
                        ]
                    }
                };

            case 'promedio_7_dias':
                const avgSales = await getAvgDailySalesForRange(pool, 7);
                return {
                    action: 'promedio_7_dias',
                    response: {
                        type: 'metric',
                        value: avgSales,
                        unit: 'unidades/día',
                        period: '7 días',
                        label: 'Promedio de ventas diarias'
                    }
                };

            case 'total_ventas_dia':
                const totalToday = await getTotalSalesToday(pool);
                return {
                    action: 'total_ventas_dia',
                    response: {
                        type: 'metric',
                        value: totalToday,
                        unit: 'unidades',
                        period: 'hoy',
                        label: 'Total de ventas'
                    }
                };

            case 'alertas':
                const alerts = await getStockAlertsForWhatsApp(pool);
                return {
                    action: 'alertas',
                    response: {
                        type: 'alerts',
                        count: alerts.length,
                        alerts: alerts
                    }
                };

            case 'top_5_productos':
                const topProducts = await getTopProducts(pool, 30, 5);
                return {
                    action: 'top_5_productos',
                    response: {
                        type: 'ranking',
                        products: topProducts.map((p, idx) => ({
                            rank: idx + 1,
                            name: p.product_name,
                            sales: p.total_quantity,
                            revenue: parseFloat(p.total_revenue || 0).toFixed(2)
                        }))
                    }
                };

            default:
                return {
                    action: 'unknown',
                    response: {
                        type: 'error',
                        message: 'Acción no reconocida. Envía "menu" para ver las opciones disponibles.'
                    }
                };
        }
    } catch (error) {
        console.error(`❌ Error procesando acción ${action}:`, error);
        return {
            action: action,
            response: {
                type: 'error',
                message: 'Ocurrió un error al procesar tu solicitud. Por favor intenta de nuevo.',
                error: error.message
            }
        };
    }
}

/**
 * Obtiene las alertas de stock en formato optimizado para WhatsApp
 * @param {Pool} pool - Conexión a PostgreSQL
 * @returns {Promise<Array>} Lista de alertas con información simplificada
 */
async function getStockAlertsForWhatsApp(pool) {
    const query = `
        SELECT
            sa.severity,
            sa.days_until_stockout,
            p.name AS product_name,
            p.stock AS current_stock
        FROM stock_alerts sa
        JOIN products p ON sa.product_id = p.id
        WHERE sa.resolved = false
        ORDER BY sa.severity DESC, sa.days_until_stockout ASC
        LIMIT 10;
    `;

    const result = await pool.query(query);

    return result.rows.map(alert => ({
        product: alert.product_name,
        stock: alert.current_stock,
        days_until_stockout: alert.days_until_stockout,
        severity: getSeverityText(alert.severity)
    }));
}

/**
 * Convierte el código de severidad a texto legible
 * @param {number} severity - Código de severidad (1-3)
 * @returns {string} Texto descriptivo
 */
function getSeverityText(severity) {
    switch (severity) {
        case 3: return 'CRÍTICO';
        case 2: return 'MEDIO';
        case 1: return 'BAJO';
        default: return 'DESCONOCIDO';
    }
}

module.exports = {
    processWhatsAppAction,
    isWhatsAppNumberAuthorized
};
