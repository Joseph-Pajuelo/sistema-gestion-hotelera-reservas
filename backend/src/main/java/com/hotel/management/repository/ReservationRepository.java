package com.hotel.management.repository;

import com.hotel.management.model.Reservation;
import com.hotel.management.model.enums.ReservationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface ReservationRepository extends JpaRepository<Reservation, Long> {

    List<Reservation> findAllByOrderByCheckInDateDesc();

    long countByStatus(ReservationStatus status);

    /**
     * VERIFICACIÓN MATEMÁTICA DE SOLAPAMIENTO DE INTERVALOS [checkIn, checkOut):
     * Dos intervalos [A, B) y [C, D) se solapan sí y solo si: A < D AND B > C.
     * Esta consulta se ejecuta DENTRO de la transacción atómica una vez adquirido
     * el bloqueo pesimista sobre la habitación.
     */
    @Query("""
        SELECT COUNT(r) > 0
        FROM Reservation r
        WHERE r.room.id = :roomId
          AND r.status <> com.hotel.management.model.enums.ReservationStatus.CANCELLED
          AND r.checkInDate < :checkOut
          AND r.checkOutDate > :checkIn
    """)
    boolean existsOverlappingReservation(
            @Param("roomId") Long roomId,
            @Param("checkIn") LocalDate checkIn,
            @Param("checkOut") LocalDate checkOut
    );
}
