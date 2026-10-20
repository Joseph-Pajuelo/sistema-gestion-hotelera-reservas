-- =============================================================================
-- SISTEMA DE GESTIÓN HOTELERA Y RESERVAS
-- Fase 1: Datos Semilla (Seed Data) para Pruebas y Analítica de Negocio
-- =============================================================================

-- 1. Categorías de Habitación (room_types)
INSERT INTO room_types (name, description, base_price, max_capacity) VALUES
('Standard Simple', 'Habitación individual ideal para viajes de negocios con escritorio ergonómico y Wi-Fi de alta velocidad.', 150.00, 1),
('Doble Superior', 'Habitación con dos camas de 2 plazas o cama Queen, vista a la ciudad y minibar.', 240.00, 2),
('Suite Ejecutiva', 'Suite amplia con cama King, sala de estar independiente, bañera de hidromasaje y desayuno buffet incluido.', 380.00, 3),
('Suite Presidencial', 'Piso alto con vista panorámica, comedor privado, jacuzzi y atención preferencial 24/7.', 650.00, 4);

-- 2. Inventario Físico de Habitaciones (rooms - 12 habitaciones en 4 pisos)
INSERT INTO rooms (room_number, floor, room_type_id, status) VALUES
('101', 1, 1, 'OCCUPIED'),
('102', 1, 1, 'AVAILABLE'),
('103', 1, 1, 'AVAILABLE'),
('201', 2, 2, 'OCCUPIED'),
('202', 2, 2, 'AVAILABLE'),
('203', 2, 2, 'CLEANING'),
('301', 3, 3, 'OCCUPIED'),
('302', 3, 3, 'AVAILABLE'),
('303', 3, 3, 'MAINTENANCE'),
('401', 4, 4, 'AVAILABLE'),
('402', 4, 4, 'AVAILABLE'),
('403', 4, 3, 'AVAILABLE');

-- 3. Huéspedes (guests)
INSERT INTO guests (document_type, document_number, first_name, last_name, email, phone) VALUES
('DNI', '74829103', 'Carlos', 'Mendoza Ríos', 'carlos.mendoza@empresa.pe', '+51 987654321'),
('DNI', '46192837', 'Valeria', 'Gómez Paredes', 'valeria.gomez@correo.com', '+51 912345678'),
('PASSPORT', 'US8839201', 'Michael', 'Thornton', 'm.thornton@globalcorp.com', '+1 4158902341'),
('DNI', '71029384', 'Lucía', 'Fernández Soto', 'lucia.fernandez@utp.edu.pe', '+51 998877665'),
('CE', '004928172', 'Andrés', 'Villanueva Castro', 'andres.villanueva@consultora.co', '+51 945612378'),
('DNI', '75920184', 'Jorge', 'Salazar Quispe', 'jorge.salazar@minera.pe', '+51 965432189');

-- 4. Reservas históricas y actuales (reservations)
-- Usamos fechas relativas a CURRENT_DATE para que el dashboard siempre muestre métricas vivas
INSERT INTO reservations (reservation_code, guest_id, room_id, check_in_date, check_out_date, status, total_amount, notes) VALUES
-- Reservas completadas del mes pasado (para comparativa MoM)
('RES-2026-0001', 1, 1, CURRENT_DATE - INTERVAL '35 days', CURRENT_DATE - INTERVAL '32 days', 'CHECKED_OUT', 450.00, 'Viaje corporativo'),
('RES-2026-0002', 2, 4, CURRENT_DATE - INTERVAL '28 days', CURRENT_DATE - INTERVAL '24 days', 'CHECKED_OUT', 960.00, 'Solicitó piso bajo'),
('RES-2026-0003', 3, 10, CURRENT_DATE - INTERVAL '22 days', CURRENT_DATE - INTERVAL '19 days', 'CHECKED_OUT', 1950.00, 'Traslado aeropuerto incluido'),

-- Reservas completadas de este mes
('RES-2026-0004', 4, 2, CURRENT_DATE - INTERVAL '12 days', CURRENT_DATE - INTERVAL '9 days', 'CHECKED_OUT', 450.00, 'Sin observaciones'),
('RES-2026-0005', 5, 7, CURRENT_DATE - INTERVAL '8 days', CURRENT_DATE - INTERVAL '5 days', 'CHECKED_OUT', 1140.00, 'Check-out tardío autorizado'),

-- Reservas actualmente en curso (CHECKED_IN)
('RES-2026-0006', 1, 1, CURRENT_DATE - INTERVAL '2 days', CURRENT_DATE + INTERVAL '2 days', 'CHECKED_IN', 600.00, 'Cliente frecuente - 2da visita'),
('RES-2026-0007', 6, 4, CURRENT_DATE - INTERVAL '1 day', CURRENT_DATE + INTERVAL '3 days', 'CHECKED_IN', 960.00, 'Facturación a empresa'),
('RES-2026-0008', 3, 7, CURRENT_DATE - INTERVAL '1 day', CURRENT_DATE + INTERVAL '4 days', 'CHECKED_IN', 1900.00, 'Huésped VIP'),

-- Reservas futuras confirmadas (CONFIRMED)
('RES-2026-0009', 2, 10, CURRENT_DATE + INTERVAL '3 days', CURRENT_DATE + INTERVAL '6 days', 'CONFIRMED', 1950.00, 'Aniversario - preparar cortesía'),
('RES-2026-0010', 4, 5, CURRENT_DATE + INTERVAL '5 days', CURRENT_DATE + INTERVAL '8 days', 'CONFIRMED', 720.00, 'Pago adelantado 50%'),

-- Reserva cancelada (demuestra que el constraint GiST ignora canceladas si alguien reserva las mismas fechas)
('RES-2026-0011', 5, 5, CURRENT_DATE + INTERVAL '5 days', CURRENT_DATE + INTERVAL '7 days', 'CANCELLED', 480.00, 'Canceló por cambio de vuelo');

-- 5. Pagos registrados (payments)
INSERT INTO payments (reservation_id, amount, payment_method, payment_status, transaction_reference, paid_at) VALUES
(1, 450.00, 'CREDIT_CARD', 'COMPLETED', 'VISA-992011', CURRENT_DATE - INTERVAL '32 days'),
(2, 960.00, 'TRANSFER', 'COMPLETED', 'BCP-8839201', CURRENT_DATE - INTERVAL '24 days'),
(3, 1950.00, 'CREDIT_CARD', 'COMPLETED', 'AMEX-441092', CURRENT_DATE - INTERVAL '19 days'),
(4, 450.00, 'YAPE_PLIN', 'COMPLETED', 'YAPE-772819', CURRENT_DATE - INTERVAL '9 days'),
(5, 1140.00, 'DEBIT_CARD', 'COMPLETED', 'MC-331920', CURRENT_DATE - INTERVAL '5 days'),
-- Pagos de reservas en curso y futuras (algunas con pago parcial para mostrar control de saldos)
(6, 600.00, 'CREDIT_CARD', 'COMPLETED', 'VISA-551920', CURRENT_DATE - INTERVAL '2 days'),
(7, 480.00, 'TRANSFER', 'COMPLETED', 'BBVA-112938', CURRENT_DATE - INTERVAL '1 day'),
(8, 1000.00, 'CREDIT_CARD', 'COMPLETED', 'AMEX-998123', CURRENT_DATE - INTERVAL '1 day'),
(9, 1000.00, 'TRANSFER', 'COMPLETED', 'BCP-661239', CURRENT_DATE - INTERVAL '1 day'),
(10, 360.00, 'YAPE_PLIN', 'COMPLETED', 'PLIN-449182', CURRENT_DATE);
