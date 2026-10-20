# 🏨 Sistema de Gestión Hotelera, Reservas e Inteligencia Comercial (BI)

🌐 **Demo en Vivo (Vercel):** **[https://sistema-gestion-hotelera-reservas.vercel.app](https://sistema-gestion-hotelera-reservas.vercel.app)**

Sistema Full-Stack para la administración de inventario hotelero, reservas transaccionales con prevención de **Overbooking** y extracción de indicadores clave de negocio (**KPIs: Tasa de Ocupación, ADR, RevPAR y Flujo de Caja**).

---

## 🚀 Stack Tecnológico

* **Base de Datos y Analítica:** PostgreSQL 16 (Esquema normalizado en **3NF**, índices compuestos, extensión `btree_gist` y consultas SQL avanzadas con CTEs y Funciones de Ventana).
* **Backend:** Java 17, Spring Boot 3.3, Spring Data JPA / Hibernate, Bean Validation, Arquitectura en capas (**MVC + Service + DTO con `record` + DAO/Repository**).
* **Control de Concurrencia (Anti-Overbooking):** Transacciones atómicas ACID (`@Transactional`) combinadas con **Bloqueo Pesimista (`@Lock(LockModeType.PESSIMISTIC_WRITE)` / `SELECT ... FOR UPDATE`)** y restricción física `EXCLUDE USING gist` en PostgreSQL.
* **Frontend:** React 18, TypeScript, Vite, estética Dark Telemetry con tarjetas interactivas 3D (`TiltCard`), validación diferida (`:user-invalid`) y tablas responsivas con `@container` queries.
* **Contenedores y Despliegue:** Docker (`Dockerfile` Multi-Stage para Backend JRE Alpine y Frontend Nginx Reverse Proxy) y orquestación con `docker-compose.yml`.

---

## 🗂️ Estructura del Proyecto

```text
hotel-management-system/
├── database/
│   ├── 01_schema.sql             # Esquema relacional en 3NF + Constraint GiST anti-overbooking
│   ├── 02_seed_data.sql          # Datos semilla de categorías, habitaciones, huéspedes, reservas y pagos
│   └── 03_analytics_queries.sql  # Consultas SQL avanzadas de BI (Ocupación, ADR, RevPAR, MoM con LAG)
├── backend/
│   ├── Dockerfile                # Multi-Stage Build (Maven JDK 17 -> Eclipse Temurin JRE 17 Alpine)
│   ├── pom.xml                   # Configuración Maven y dependencias Spring Boot 3
│   └── src/
│       ├── main/java/com/hotel/management/
│       │   ├── controller/       # Endpoints REST (/api/rooms, /api/reservations, /api/guests, /api/payments, /api/analytics)
│       │   ├── service/          # Lógica de negocio y transacciones atómicas (@Transactional)
│       │   ├── repository/       # Capa DAO / JPA + @Lock(LockModeType.PESSIMISTIC_WRITE)
│       │   ├── dto/              # Objetos de transferencia inmutables (Java 17 records)
│       │   ├── model/            # Entidades JPA mapeadas al esquema 3NF
│       │   └── exception/        # Manejo centralizado de errores (@RestControllerAdvice -> HTTP 409 / 400 / 404)
│       └── test/java/com/hotel/management/
│           └── ConcurrencyOverbookingTest.java # Prueba multihilo (CountDownLatch) contra Overbooking
├── frontend/
│   ├── Dockerfile                # Multi-Stage Build (Node 22 Alpine -> Nginx 1.27 Alpine)
│   ├── nginx.conf                # Servidor SPA + Reverse Proxy (/api/ -> backend:8080)
│   └── src/
│       ├── components/TiltCard.tsx # Tarjeta 3D con seguimiento de puntero y spotlight radial
│       ├── services/api.ts       # Cliente HTTP tipado hacia el Backend
│       ├── types/hotel.ts        # Contratos TypeScript espejados con los DTOs de Java 17
│       └── App.tsx               # Dashboard de KPIs, Simulador de Concurrencia, Huéspedes y Caja
└── docker-compose.yml            # Orquestación completa: PostgreSQL + Backend + Frontend
```

---

## 🐳 Despliegue Rápido con Docker Compose (Producción)

1. Asegúrate de tener **Docker Desktop** abierto.
2. En la raíz del proyecto (`hotel-management-system/`), ejecuta:

```bash
docker compose up --build -d
```

3. Accede a los servicios:
   * **Frontend Web (Nginx + React):** `http://localhost:3000`
   * **API REST Backend (Spring Boot):** `http://localhost:8080/api/analytics/dashboard`
   * **Base de Datos PostgreSQL:** `localhost:5432` (BD: `hotel_db`, Usuario: `hotel_admin`)

---

## 💻 Ejecución en Entorno de Desarrollo Local

### 1. Levantar el Backend (con perfil local en memoria o PostgreSQL)
```bash
cd backend
.\mvnw.cmd spring-boot:run -Dspring-boot.run.profiles=local
```
Para ejecutar la prueba automatizada de concurrencia (2 hilos simultáneos intentando reservar la misma habitación):
```bash
cd backend
.\mvnw.cmd test
```

### 2. Levantar el Frontend (Vite Dev Server)
```bash
cd frontend
npm install
npm run dev
```
Abre `http://localhost:5173` en tu navegador.
