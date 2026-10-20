package com.hotel.management.dto;

import java.math.BigDecimal;
import java.util.List;

public record DashboardMetricsDTO(
        long totalRooms,
        long occupiedRooms,
        long availableRooms,
        long unavailableRooms,
        BigDecimal occupancyRatePct,
        BigDecimal adr,
        BigDecimal revPar,
        BigDecimal totalCollectedRevenue,
        BigDecimal totalPendingBalance,
        long activeReservationsCount,
        List<CategoryMetricDTO> categoryBreakdown
) {
    public record CategoryMetricDTO(
            String categoryName,
            BigDecimal basePrice,
            long totalRooms,
            long occupiedRooms,
            long availableRooms,
            BigDecimal occupancyPct
    ) {}
}
