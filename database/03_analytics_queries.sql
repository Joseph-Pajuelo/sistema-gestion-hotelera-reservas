-- =============================================================================
-- SISTEMA DE GESTIÓN HOTELERA Y RESERVAS
-- Fase 1: Consultas SQL Avanzadas para Analítica e Inteligencia de Negocios (BI)
-- Incluye: CTEs (WITH), Funciones de Ventana (LAG, SUM OVER), FILTER y KPIs Hoteleros
-- =============================================================================

-- =============================================================================
-- CONSULTA 1: KPI de Ocupación Actual y Rendimiento por Categoría de Habitación
-- Métricas: Total habitaciones, Ocupadas, Disponibles, En Mantenimiento y % Ocupación
-- =============================================================================
SELECT
    rt.name AS categoria_habitacion,
    rt.base_price AS tarifa_base,
    COUNT(r.id) AS total_habitaciones,
    COUNT(r.id) FILTER (WHERE r.status = 'OCCUPIED') AS ocupadas,
    COUNT(r.id) FILTER (WHERE r.status = 'AVAILABLE') AS disponibles,
    COUNT(r.id) FILTER (WHERE r.status IN ('MAINTENANCE', 'CLEANING')) AS no_disponibles,
    ROUND(
        (COUNT(r.id) FILTER (WHERE r.status = 'OCCUPIED')::NUMERIC / NULLIF(COUNT(r.id), 0)) * 100,
        2
    ) AS tasa_ocupacion_pct
FROM room_types rt
LEFT JOIN rooms r ON r.room_type_id = rt.id
GROUP BY rt.id, rt.name, rt.base_price
ORDER BY tasa_ocupacion_pct DESC;

-- =============================================================================
-- CONSULTA 2: KPIs Estándar de la Industria Hotelera (ADR y RevPAR) - Últimos 30 días
-- * ADR (Average Daily Rate): Ingreso promedio por noche ocupada.
-- * RevPAR (Revenue Per Available Room): Ingreso generado por cada habitación existente.
-- =============================================================================
WITH metricas_30_dias AS (
    SELECT
        COALESCE(SUM(res.total_amount), 0) AS ingresos_totales_reservas,
        COALESCE(SUM(res.check_out_date - res.check_in_date), 0) AS noches_vendidas
    FROM reservations res
    WHERE res.status IN ('CHECKED_IN', 'CHECKED_OUT', 'CONFIRMED')
      AND res.check_in_date >= CURRENT_DATE - INTERVAL '30 days'
),
inventario_total AS (
    SELECT COUNT(*) AS total_habitaciones FROM rooms
)
SELECT
    m.ingresos_totales_reservas,
    m.noches_vendidas,
    i.total_habitaciones * 30 AS noches_disponibles_mes,
    ROUND(m.ingresos_totales_reservas / NULLIF(m.noches_vendidas, 0), 2) AS adr_tarifa_diaria_promedio,
    ROUND(m.ingresos_totales_reservas / NULLIF(i.total_habitaciones * 30, 0), 2) AS revpar_ingreso_por_hab_disponible
FROM metricas_30_dias m
CROSS JOIN inventario_total i;

-- =============================================================================
-- CONSULTA 3: Facturación Mensual y Crecimiento MoM (Month-over-Month)
-- Usa CTEs + Función de Ventana LAG() para comparar recaudación mes a mes.
-- =============================================================================
WITH facturacion_mensual AS (
    SELECT
        DATE_TRUNC('month', p.paid_at)::DATE AS mes,
        COUNT(p.id) AS cantidad_transacciones,
        SUM(p.amount) AS total_recaudado
    FROM payments p
    WHERE p.payment_status = 'COMPLETED'
    GROUP BY DATE_TRUNC('month', p.paid_at)::DATE
)
SELECT
    TO_CHAR(mes, 'YYYY-MM') AS periodo,
    cantidad_transacciones,
    total_recaudado,
    LAG(total_recaudado) OVER (ORDER BY mes) AS recaudado_mes_anterior,
    ROUND(
        ((total_recaudado - LAG(total_recaudado) OVER (ORDER BY mes))
        / NULLIF(LAG(total_recaudado) OVER (ORDER BY mes), 0)) * 100,
        2
    ) AS crecimiento_mom_pct
FROM facturacion_mensual
ORDER BY mes DESC;

-- =============================================================================
-- CONSULTA 4: Control de Saldos y Cuentas por Cobrar por Reserva Activa
-- Detecta reservas donde el monto pagado es menor al total_amount (pagos parciales).
-- =============================================================================
SELECT
    res.reservation_code,
    g.first_name || ' ' || g.last_name AS huesped,
    rm.room_number AS habitacion,
    res.status AS estado_reserva,
    res.total_amount AS monto_total,
    COALESCE(SUM(p.amount) FILTER (WHERE p.payment_status = 'COMPLETED'), 0.00) AS monto_pagado,
    res.total_amount - COALESCE(SUM(p.amount) FILTER (WHERE p.payment_status = 'COMPLETED'), 0.00) AS saldo_pendiente
FROM reservations res
JOIN guests g ON g.id = res.guest_id
JOIN rooms rm ON rm.id = res.room_id
LEFT JOIN payments p ON p.reservation_id = res.id
WHERE res.status <> 'CANCELLED'
GROUP BY res.id, res.reservation_code, g.first_name, g.last_name, rm.room_number, res.status, res.total_amount
ORDER BY saldo_pendiente DESC, res.check_in_date ASC;
