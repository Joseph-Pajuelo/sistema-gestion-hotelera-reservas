package com.hotel.management.repository;

import com.hotel.management.model.Room;
import com.hotel.management.model.enums.RoomStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface RoomRepository extends JpaRepository<Room, Long> {

    List<Room> findAllByOrderByRoomNumberAsc();

    long countByStatus(RoomStatus status);

    /**
     * CONTROL DE CONCURRENCIA A NIVEL DE BASE DE DATOS (Bloqueo Pesimista):
     * Ejecuta "SELECT ... FROM rooms WHERE id = ? FOR UPDATE".
     * Si dos peticiones concurrentes intentan reservar la misma habitación en el mismo
     * milisegundo, la segunda queda bloqueada esperando a que la primera transacción haga
     * COMMIT o ROLLBACK, impidiendo condiciones de carrera (Race Conditions / Overbooking).
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT r FROM Room r WHERE r.id = :id")
    Optional<Room> findByIdWithPessimisticLock(@Param("id") Long id);

    /**
     * Consulta qué habitaciones están disponibles para un rango de fechas dado.
     */
    @Query("""
        SELECT r FROM Room r
        WHERE r.status <> 'MAINTENANCE'
          AND NOT EXISTS (
              SELECT 1 FROM Reservation res
              WHERE res.room.id = r.id
                AND res.status <> 'CANCELLED'
                AND res.checkInDate < :checkOut
                AND res.checkOutDate > :checkIn
          )
        ORDER BY r.roomNumber ASC
    """)
    List<Room> findAvailableRoomsForDates(
            @Param("checkIn") LocalDate checkIn,
            @Param("checkOut") LocalDate checkOut
    );
}
