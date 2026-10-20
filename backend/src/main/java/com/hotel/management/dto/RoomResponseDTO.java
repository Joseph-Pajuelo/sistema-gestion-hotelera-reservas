package com.hotel.management.dto;

import com.hotel.management.model.enums.RoomStatus;
import java.math.BigDecimal;

public record RoomResponseDTO(
        Long id,
        String roomNumber,
        Integer floor,
        String roomTypeName,
        String description,
        BigDecimal basePrice,
        Integer maxCapacity,
        RoomStatus status
) {
}
