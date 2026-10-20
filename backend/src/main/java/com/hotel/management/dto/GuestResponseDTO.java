package com.hotel.management.dto;

import java.time.OffsetDateTime;

public record GuestResponseDTO(
        Long id,
        String documentType,
        String documentNumber,
        String firstName,
        String lastName,
        String email,
        String phone,
        OffsetDateTime createdAt
) {
}
