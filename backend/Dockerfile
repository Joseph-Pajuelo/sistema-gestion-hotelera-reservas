# =============================================================================
# ETAPA 1: Compilación (Builder Stage)
# Usa una imagen con JDK 17 y Maven para compilar el código fuente y empaquetar el JAR
# =============================================================================
FROM maven:3.9.9-eclipse-temurin-17 AS builder

WORKDIR /app

# 1. Copiamos primero solo el pom.xml para aprovechar el caché de capas de Docker
COPY pom.xml .
RUN mvn dependency:go-offline -B

# 2. Copiamos el código fuente y compilamos el artefacto ejecutable sin correr tests pesados
COPY src ./src
RUN mvn clean package -DskipTests -B

# =============================================================================
# ETAPA 2: Ejecución Ligera y Segura (Runtime Stage)
# Usa únicamente el JRE 17 sobre Alpine Linux (~180MB en lugar de ~800MB)
# =============================================================================
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

# Creamos un usuario sin privilegios de root por seguridad en producción
RUN addgroup -S spring && adduser -S spring -G spring
USER spring:spring

# Copiamos únicamente el .jar compilado desde la Etapa 1 (Builder)
COPY --from=builder /app/target/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-XX:+UseContainerSupport", "-XX:MaxRAMPercentage=75.0", "-jar", "app.jar"]
