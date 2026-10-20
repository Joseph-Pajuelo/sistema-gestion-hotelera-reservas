package com.hotel.management.dto;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public record ReservationRequestDTO(
        @NotNull(message = "El ID del huésped es obligatorio")
        Long guestId,

        @NotNull(message = "El ID de la habitación es obligatorio")
        Long roomId,

        @NotNull(message = "La fecha de check-in es obligatoria")
        LocalDate checkInDate,

        @NotNull(message = "La fecha de check-out es obligatoria")
        LocalDate checkOutDate,

        String notes
) {
}
