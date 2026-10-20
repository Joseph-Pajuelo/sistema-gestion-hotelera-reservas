-- =============================================================================
-- SISTEMA DE GESTIÓN HOTELERA Y RESERVAS
-- Fase 1: Esquema Relacional Normalizado (3NF) y Control de Concurrencia en BD
-- Motor: PostgreSQL 16+
-- =============================================================================

-- Extensión necesaria para restricciones de exclusión de rangos de fechas (GiST)
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Limpieza previa en caso de reinicio del entorno de desarrollo
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS reservations CASCADE;
DROP TABLE IF EXISTS rooms CASCADE;
DROP TABLE IF EXISTS room_types CASCADE;
DROP TABLE IF EXISTS guests CASCADE;

-- =============================================================================
-- 1. TABLA: room_types (Catálogo de Categorías de Habitación)
-- Cumple 3NF: Evita duplicar precios base y capacidades en cada habitación física.
-- =============================================================================
CREATE TABLE room_types (
    id              BIGSERIAL PRIMARY KEY,
    name            VARCHAR(50) NOT NULL UNIQUE,
    description     TEXT,
    base_price      NUMERIC(10, 2) NOT NULL CHECK (base_price > 0),
    max_capacity    INT NOT NULL CHECK (max_capacity >= 1),
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- 2. TABLA: rooms (Inventario Físico de Habitaciones)
-- =============================================================================
CREATE TABLE rooms (
    id              BIGSERIAL PRIMARY KEY,
    room_number     VARCHAR(10) NOT NULL UNIQUE,
    floor           INT NOT NULL CHECK (floor >= 1),
    room_type_id    BIGINT NOT NULL REFERENCES room_types(id) ON DELETE RESTRICT,
    status          VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE'
                    CHECK (status IN ('AVAILABLE', 'OCCUPIED', 'MAINTENANCE', 'CLEANING')),
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_rooms_type_status ON rooms(room_type_id, status);

-- =============================================================================
-- 3. TABLA: guests (Maestro de Huéspedes)
-- =============================================================================
CREATE TABLE guests (
    id              BIGSERIAL PRIMARY KEY,
    document_type   VARCHAR(15) NOT NULL DEFAULT 'DNI'
                    CHECK (document_type IN ('DNI', 'PASSPORT', 'CE')),
    document_number VARCHAR(25) NOT NULL UNIQUE,
    first_name      VARCHAR(80) NOT NULL,
    last_name       VARCHAR(80) NOT NULL,
    email           VARCHAR(120) NOT NULL UNIQUE,
    phone           VARCHAR(25),
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_guests_document ON guests(document_number);
CREATE INDEX idx_guests_lastname ON guests(last_name);

-- =============================================================================
-- 4. TABLA: reservations (Transacciones de Reserva y Prevención de Overbooking)
-- =============================================================================
CREATE TABLE reservations (
    id                  BIGSERIAL PRIMARY KEY,
    reservation_code    VARCHAR(20) NOT NULL UNIQUE,
    guest_id            BIGINT NOT NULL REFERENCES guests(id) ON DELETE RESTRICT,
    room_id             BIGINT NOT NULL REFERENCES rooms(id) ON DELETE RESTRICT,
    check_in_date       DATE NOT NULL,
    check_out_date      DATE NOT NULL,
    status              VARCHAR(20) NOT NULL DEFAULT 'CONFIRMED'
                        CHECK (status IN ('PENDING', 'CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT', 'CANCELLED')),
    total_amount        NUMERIC(10, 2) NOT NULL CHECK (total_amount >= 0),
    notes               TEXT,
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Regla de negocio: La fecha de salida debe ser estrictamente posterior al ingreso
    CONSTRAINT chk_valid_dates CHECK (check_out_date > check_in_date),

    -- DEFENSA A NIVEL DE BD CONTRA OVERBOOKING (Constraint de Exclusión GiST):
    -- Garantiza que jamás existan dos reservas activas (no canceladas) para la
    -- misma habitación cuyos rangos [check_in_date, check_out_date) se solapen.
    -- El intervalo '[)' permite que un huésped haga check-out el mismo día que otro hace check-in.
    CONSTRAINT excl_no_overbooking EXCLUDE USING gist (
        room_id WITH =,
        daterange(check_in_date, check_out_date, '[)') WITH &&
    ) WHERE (status <> 'CANCELLED')
);

CREATE INDEX idx_reservations_room_dates ON reservations(room_id, check_in_date, check_out_date);
CREATE INDEX idx_reservations_guest ON reservations(guest_id);
CREATE INDEX idx_reservations_status ON reservations(status);

-- =============================================================================
-- 5. TABLA: payments (Registro de Pagos y Facturación)
-- Relación 1:N con reservations (permite adelantos, pagos parciales y liquidación)
-- =============================================================================
CREATE TABLE payments (
    id                      BIGSERIAL PRIMARY KEY,
    reservation_id          BIGINT NOT NULL REFERENCES reservations(id) ON DELETE RESTRICT,
    amount                  NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
    payment_method          VARCHAR(25) NOT NULL
                            CHECK (payment_method IN ('CASH', 'CREDIT_CARD', 'DEBIT_CARD', 'TRANSFER', 'YAPE_PLIN')),
    payment_status          VARCHAR(20) NOT NULL DEFAULT 'COMPLETED'
                            CHECK (payment_status IN ('PENDING', 'COMPLETED', 'REFUNDED')),
    transaction_reference   VARCHAR(60),
    paid_at                 TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_payments_reservation ON payments(reservation_id);
CREATE INDEX idx_payments_paid_at ON payments(paid_at);
