package com.hotel.management.repository;

import com.hotel.management.model.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {

    List<Payment> findByReservationIdOrderByPaidAtDesc(Long reservationId);

    List<Payment> findAllByOrderByPaidAtDesc();

    @Query("""
        SELECT COALESCE(SUM(p.amount), 0)
        FROM Payment p
        WHERE p.reservation.id = :reservationId
          AND p.paymentStatus = 'COMPLETED'
    """)
    BigDecimal sumCompletedPaymentsByReservationId(@Param("reservationId") Long reservationId);

    @Query("""
        SELECT COALESCE(SUM(p.amount), 0)
        FROM Payment p
        WHERE p.paymentStatus = 'COMPLETED'
    """)
    BigDecimal sumTotalCompletedRevenue();
}
