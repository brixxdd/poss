-- Script para generar datos de ventas de prueba
-- Ejecutar DESPUÉS de tener productos y usuarios en la BD
-- Esto genera 30 días de ventas para probar Prophet

DO $$
DECLARE
    producto_id UUID;
    usuario_id INTEGER;  -- Changed from UUID to INTEGER
    producto_nombre TEXT;
    i INTEGER;
    fecha TIMESTAMP;
    cantidad INTEGER;
    precio DECIMAL;
    venta_id UUID;
BEGIN
    -- Obtener primer producto disponible
    SELECT id, name INTO producto_id, producto_nombre FROM products LIMIT 1;

    IF producto_id IS NULL THEN
        RAISE EXCEPTION 'No hay productos en la base de datos. Agrega productos primero.';
    END IF;

    -- Obtener primer usuario admin
    SELECT id INTO usuario_id FROM users WHERE role = 'admin' LIMIT 1;

    IF usuario_id IS NULL THEN
        RAISE EXCEPTION 'No hay usuarios admin. Crea un usuario admin primero.';
    END IF;

    RAISE NOTICE '🚀 Generando ventas de prueba para producto: %', producto_nombre;

    -- Generar ventas para los últimos 30 días
    FOR i IN 0..29 LOOP
        fecha := NOW() - (i || ' days')::INTERVAL;

        -- Simular patrón de ventas:
        -- Más ventas en fin de semana (Sábado=6, Domingo=0)
        IF EXTRACT(DOW FROM fecha) IN (0, 6) THEN
            -- Fin de semana: 15-25 unidades
            cantidad := 15 + FLOOR(RANDOM() * 10)::INTEGER;
        ELSE
            -- Entre semana: 8-13 unidades
            cantidad := 8 + FLOOR(RANDOM() * 5)::INTEGER;
        END IF;

        -- Obtener precio del producto
        SELECT sale_price INTO precio FROM products WHERE id = producto_id;

        -- Insertar venta
        INSERT INTO sales (user_id, payment_method, total_amount, sale_date)
        VALUES (usuario_id, 'efectivo', precio * cantidad, fecha)
        RETURNING id INTO venta_id;

        -- Insertar items de venta
        INSERT INTO sale_items (sale_id, product_id, quantity, price_at_sale)
        VALUES (venta_id, producto_id, cantidad, precio);

        RAISE NOTICE 'Venta creada: Fecha=%, Cantidad=%', DATE(fecha), cantidad;

    END LOOP;

    RAISE NOTICE '✅ Generadas 30 ventas de prueba exitosamente';
    RAISE NOTICE 'Ahora puedes probar las predicciones de Prophet en la app!';

END $$;

-- Verificar cuántas ventas tienes ahora
SELECT COUNT(*) as total_ventas FROM sales;

-- Ver resumen de ventas por día de los últimos 30 días
SELECT
    DATE(sale_date) as fecha,
    SUM(si.quantity) as unidades_vendidas,
    EXTRACT(DOW FROM sale_date) as dia_semana,
    CASE EXTRACT(DOW FROM sale_date)
        WHEN 0 THEN 'Domingo'
        WHEN 1 THEN 'Lunes'
        WHEN 2 THEN 'Martes'
        WHEN 3 THEN 'Miércoles'
        WHEN 4 THEN 'Jueves'
        WHEN 5 THEN 'Viernes'
        WHEN 6 THEN 'Sábado'
    END as nombre_dia
FROM sales s
JOIN sale_items si ON s.id = si.sale_id
WHERE sale_date >= NOW() - INTERVAL '30 days'
GROUP BY DATE(sale_date), EXTRACT(DOW FROM sale_date)
ORDER BY fecha DESC;
