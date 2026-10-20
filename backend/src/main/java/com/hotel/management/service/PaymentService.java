package com.hotel.management.service;

import com.hotel.management.dto.PaymentRequestDTO;
import com.hotel.management.dto.PaymentResponseDTO;
import com.hotel.management.exception.ResourceNotFoundException;
import com.hotel.management.model.Payment;
import com.hotel.management.model.Reservation;
import com.hotel.management.model.enums.ReservationStatus;
import com.hotel.management.repository.PaymentRepository;
import com.hotel.management.repository.ReservationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Service
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final ReservationRepository reservationRepository;

    public PaymentService(PaymentRepository paymentRepository, ReservationRepository reservationRepository) {
        this.paymentRepository = paymentRepository;
        this.reservationRepository = reservationRepository;
    }

    @Transactional(readOnly = true)
    public List<PaymentResponseDTO> getAllPayments() {
        return paymentRepository.findAllByOrderByPaidAtDesc().stream()
                .map(this::toDTO)
                .toList();
    }

    @Transactional
    public PaymentResponseDTO registerPayment(PaymentRequestDTO request) {
        Reservation reservation = reservationRepository.findById(request.reservationId())
                .orElseThrow(() -> new ResourceNotFoundException("Reserva no encontrada con ID: " + request.reservationId()));

        if (reservation.getStatus() == ReservationStatus.CANCELLED) {
            throw new IllegalArgumentException("No se pueden registrar pagos sobre una reserva cancelada.");
        }

        BigDecimal alreadyPaid = paymentRepository.sumCompletedPaymentsByReservationId(reservation.getId());
        BigDecimal pendingBalance = reservation.getTotalAmount().subtract(alreadyPaid);

        if (request.amount().compareTo(pendingBalance) > 0) {
            throw new IllegalArgumentException(
                    String.format("El monto ingresado (S/ %s) supera el saldo pendiente de la reserva (S/ %s).",
                            request.amount(), pendingBalance)
            );
        }

        Payment payment = new Payment();
        payment.setReservation(reservation);
        payment.setAmount(request.amount());
        payment.setPaymentMethod(request.paymentMethod());
        payment.setPaymentStatus("COMPLETED");
        String ref = (request.transactionReference() != null && !request.transactionReference().isBlank())
                ? request.transactionReference().trim()
                : request.paymentMethod().name() + "-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
        payment.setTransactionReference(ref);

        return toDTO(paymentRepository.save(payment));
    }

    private PaymentResponseDTO toDTO(Payment p) {
        Reservation r = p.getReservation();
        return new PaymentResponseDTO(
                p.getId(),
                r.getId(),
                r.getReservationCode(),
                r.getGuest().getFirstName() + " " + r.getGuest().getLastName(),
                p.getAmount(),
                p.getPaymentMethod(),
                p.getPaymentStatus(),
                p.getTransactionReference(),
                p.getPaidAt()
        );
    }
}
