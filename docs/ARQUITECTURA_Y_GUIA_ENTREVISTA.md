# 📘 Documentación Técnica y Arquitectura del Sistema de Gestión Hotelera y Reservas

**Enlaces del Proyecto:**
* 🌐 **Producción (Vercel):** [https://sistema-gestion-hotelera-reservas.vercel.app](https://sistema-gestion-hotelera-reservas.vercel.app)
* 💻 **Repositorio (GitHub):** [https://github.com/Joseph-Pajuelo/sistema-gestion-hotelera-reservas](https://github.com/Joseph-Pajuelo/sistema-gestion-hotelera-reservas)

---

## 1. Visión General: ¿Cómo funciona el sistema de extremo a extremo?

El **Sistema de Gestión Hotelera y Reservas (*Costa Sol & Mar*)** es una plataforma Full-Stack transaccional y analítica diseñada para resolver dos problemas críticos de la operación hotelera:
1. **Integridad de Inventario (Cero Overbooking):** Evitar que dos recepcionistas o clientes web reserven la misma habitación en fechas superpuestas cuando envían peticiones en el mismo milisegundo.
2. **Inteligencia Comercial en Tiempo Real (BI & KPIs):** Transformar los registros operativos de reservas y pagos parciales en indicadores ejecutivos para la toma de decisiones (**Tasa de Ocupación**, **ADR**, **RevPAR** y **Cuentas por Cobrar**).

---

## 2. Desglose Técnico Capa por Capa

### Capa 1: Base de Datos Relacional Normalizada (3NF) y Analítica SQL
Archivos clave: `database/01_schema.sql`, `database/02_seed_data.sql`, `database/03_analytics_queries.sql`.

* **¿Por qué cumple 3NF?**
  * Separar `room_types` de `rooms` elimina la **dependencia transitiva** (`room_id -> tipo -> precio_base`). Si cambia la tarifa de la *Suite Ejecutiva*, se actualiza 1 sola fila en `room_types` en lugar de modificar decenas de habitaciones físicas.
  * Separar `payments` en relación `1:N` con `reservations` permite registrar **adelantos parciales** (p. ej. 50% con Yape/Plin al reservar) y **liquidaciones** (50% con tarjeta al hacer *check-out*), calculando dinámicamente el saldo pendiente por cobrar.
* **Fórmulas e Indicadores Analíticos (BI Hotelero):**
  1. **Tasa de Ocupación (% Occupancy Rate):** `(Habitaciones Ocupadas / Total de Habitaciones) * 100`
  2. **ADR (Average Daily Rate / Tarifa Diaria Promedio):** `Ingresos por Reservas Activas / Total de Noches Vendidas`
  3. **RevPAR (Revenue Per Available Room):** `Ingresos por Reservas Activas / (Total de Habitaciones * 30)`
  4. **Crecimiento Mensual (MoM):** Usa CTEs (`WITH`) y la función de ventana `LAG(total_recaudado) OVER (ORDER BY mes)`.

---

### Capa 2: Arquitectura Backend en Java 17 y Spring Boot 3
Archivos clave: `controller/`, `service/`, `repository/`, `dto/`, `model/`, `exception/`.

* **Patrón MVC + Service + Repository (DAO):**
  * **`controller/`**: Expone los endpoints RESTful (`/api/rooms`, `/api/reservations`, `/api/guests`, `/api/payments`, `/api/analytics/dashboard`) y valida los datos de entrada con `@Valid`.
  * **`dto/`**: Implementado con **`record` de Java 17** para garantizar objetos de transferencia inmutables y evitar exponer entidades JPA (`@Entity`) directamente en la API.
  * **`service/`**: Contiene las reglas de negocio y la demarcación transaccional `@Transactional`.
  * **`repository/`**: Encapsula el acceso a datos mediante Spring Data JPA / Hibernate.
  * **`exception/`**: Centraliza el manejo de errores con `@RestControllerAdvice`, transformando conflictos de concurrencia en respuestas `HTTP 409 CONFLICT`.

---

### Capa 3: Prevención de Overbooking y Control de Concurrencia
Archivos clave: `RoomRepository.java`, `ReservationRepository.java`, `ReservationService.java`, `ConcurrencyOverbookingTest.java`.

1. **Defensa en Aplicación (Bloqueo Pesimista JPA):**
   En `RoomRepository.findByIdWithPessimisticLock()` se utiliza `@Lock(LockModeType.PESSIMISTIC_WRITE)`, que emite `SELECT ... FOR UPDATE` en PostgreSQL. Esto serializa cualquier intento concurrente sobre la misma habitación.
2. **Fórmula Matemática de Solapamiento de Rangos:**
   En `ReservationRepository.existsOverlappingReservation()` se evalúa `checkInExistente < checkOutNuevo AND checkOutExistente > checkInNuevo`.
3. **Defensa Física en Motor PostgreSQL (Constraint GiST):**
   En `01_schema.sql`, la restricción `EXCLUDE USING gist (room_id WITH =, daterange(check_in_date, check_out_date, '[)') WITH &&) WHERE (status <> 'CANCELLED')` impide a nivel de motor que existan dos rangos solapados.

---

### Capa 4: Frontend en React 18 + TypeScript
Archivos clave: `App.tsx`, `TiltCard.tsx`, `api.ts`, `hotel.ts`, `index.css`.

* **Tipado Estático de Extremo a Extremo:** Las interfaces de `hotel.ts` reflejan exactamente los `record` de Java 17 del Backend.
* **Tarjetas Interactivas 3D (`TiltCard.tsx`):** Calculan la posición relativa del puntero (`--mx`, `--my`) e inclinación (`--rx`, `--ry`) mediante variables CSS sin re-renderizar React.
* **Arquitectura Híbrida para Producción en Vercel (`api.ts`):** Conecta en vivo con Spring Boot cuando está disponible y activa un motor transaccional en memoria con candado de concurrencia por habitación (`Mutex Lock`) para demostraciones Serverless en Vercel.

---

### Capa 5: Contenedores, Proxy Inverso y Despliegue (Docker & Vercel)
Archivos clave: `backend/Dockerfile`, `frontend/Dockerfile`, `frontend/nginx.conf`, `docker-compose.yml`, `frontend/vercel.json`.

* **Dockerfiles Multi-Stage:** Separan la etapa de compilación (`maven` / `node`) de la etapa ligera de ejecución (`eclipse-temurin:17-jre-alpine` / `nginx:1.27-alpine`).
* **Orquestación con Healthchecks:** En `docker-compose.yml`, el contenedor de Spring Boot espera a que PostgreSQL responda a `pg_isready` (`condition: service_healthy`) antes de iniciar.

---

## 3. Posibles Mejoras y Escalabilidad a Futuro (Roadmap)

1. **Seguridad y Control de Acceso Basado en Roles (RBAC):** Implementar **Spring Security + JWT** diferenciando permisos entre `ADMIN/GERENCIA`, `RECEPCIONISTA` y `HOUSEKEEPING`.
2. **Tarificación Dinámica (*Dynamic Pricing*) e Integración con Power BI:** Ajustar tarifas automáticamente según demanda/temporada y conectar Power BI a vistas materializadas (`MATERIALIZED VIEW`) de PostgreSQL para análisis predictivo.
3. **Caché con Redis, Flyway y Facturación Electrónica:** Incorporar caché distribuida con Redis para consultas de disponibilidad, migraciones versionadas con **Flyway** y emisión asíncrona de comprobantes electrónicos PDF.
