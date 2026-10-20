package com.hotel.management.dto;

import com.hotel.management.model.enums.PaymentMethod;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

public record PaymentResponseDTO(
        Long id,
        Long reservationId,
        String reservationCode,
        String guestFullName,
        BigDecimal amount,
        PaymentMethod paymentMethod,
        String paymentStatus,
        String transactionReference,
        OffsetDateTime paidAt
) {
}
