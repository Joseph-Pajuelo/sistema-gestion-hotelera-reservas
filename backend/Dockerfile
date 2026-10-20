# =============================================================================
# ETAPA 1: Compilación (Builder Stage)
# Usa una imagen con JDK 17 y Maven para compilar el código fuente y empaquetar el JAR
# =============================================================================
FROM maven:3.9.9-eclipse-temurin-17 AS builder

WORKDIR /app

COPY pom.xml .
COPY src ./src
RUN mvn package -DskipTests -B -q

# =============================================================================
# ETAPA 2: Ejecución Ligera y Segura (Runtime Stage)
# Usa únicamente el JRE 17 sobre Alpine Linux (~180MB en lugar de ~800MB)
# =============================================================================
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

RUN addgroup -S spring && adduser -S spring -G spring
USER spring:spring

COPY --from=builder /app/target/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-XX:+UseContainerSupport", "-XX:MaxRAMPercentage=75.0", "-jar", "app.jar"]
