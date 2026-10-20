package com.hotel.management.dto;

import com.hotel.management.model.enums.ReservationStatus;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;

public record ReservationResponseDTO(
        Long id,
        String reservationCode,
        Long guestId,
        String guestFullName,
        String guestDocument,
        Long roomId,
        String roomNumber,
        String roomTypeName,
        LocalDate checkInDate,
        LocalDate checkOutDate,
        long nights,
        ReservationStatus status,
        BigDecimal totalAmount,
        BigDecimal amountPaid,
        BigDecimal pendingBalance,
        String notes,
        OffsetDateTime createdAt
) {
}
