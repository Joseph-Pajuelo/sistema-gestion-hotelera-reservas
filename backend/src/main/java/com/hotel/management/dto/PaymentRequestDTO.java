package com.hotel.management.dto;

import com.hotel.management.model.enums.PaymentMethod;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;

public record PaymentRequestDTO(
        @NotNull(message = "El ID de la reserva es obligatorio")
        Long reservationId,

        @NotNull(message = "El monto es obligatorio")
        @Positive(message = "El monto del pago debe ser mayor a cero")
        BigDecimal amount,

        @NotNull(message = "El método de pago es obligatorio")
        PaymentMethod paymentMethod,

        String transactionReference
) {
}
