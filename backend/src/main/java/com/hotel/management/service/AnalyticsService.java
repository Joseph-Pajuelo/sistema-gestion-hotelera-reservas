package com.hotel.management.service;

import com.hotel.management.dto.DashboardMetricsDTO;
import com.hotel.management.dto.DashboardMetricsDTO.CategoryMetricDTO;
import com.hotel.management.model.Reservation;
import com.hotel.management.model.Room;
import com.hotel.management.model.RoomType;
import com.hotel.management.model.enums.ReservationStatus;
import com.hotel.management.model.enums.RoomStatus;
import com.hotel.management.repository.PaymentRepository;
import com.hotel.management.repository.ReservationRepository;
import com.hotel.management.repository.RoomRepository;
import com.hotel.management.repository.RoomTypeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
public class AnalyticsService {

    private final RoomRepository roomRepository;
    private final RoomTypeRepository roomTypeRepository;
    private final ReservationRepository reservationRepository;
    private final PaymentRepository paymentRepository;

    public AnalyticsService(
            RoomRepository roomRepository,
            RoomTypeRepository roomTypeRepository,
            ReservationRepository reservationRepository,
            PaymentRepository paymentRepository
    ) {
        this.roomRepository = roomRepository;
        this.roomTypeRepository = roomTypeRepository;
        this.reservationRepository = reservationRepository;
        this.paymentRepository = paymentRepository;
    }

    @Transactional(readOnly = true)
    public DashboardMetricsDTO getDashboardMetrics() {
        List<Room> rooms = roomRepository.findAll();
        long totalRooms = rooms.size();
        long occupiedRooms = rooms.stream().filter(r -> r.getStatus() == RoomStatus.OCCUPIED).count();
        long availableRooms = rooms.stream().filter(r -> r.getStatus() == RoomStatus.AVAILABLE).count();
        long unavailableRooms = totalRooms - occupiedRooms - availableRooms;

        BigDecimal occupancyRatePct = totalRooms > 0
                ? BigDecimal.valueOf(occupiedRooms * 100.0 / totalRooms).setScale(2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        List<Reservation> activeReservations = reservationRepository.findAll().stream()
                .filter(r -> r.getStatus() != ReservationStatus.CANCELLED)
                .toList();

        BigDecimal totalReservationValue = BigDecimal.ZERO;
        long totalNightsSold = 0;

        for (Reservation r : activeReservations) {
            totalReservationValue = totalReservationValue.add(r.getTotalAmount());
            long nights = Math.max(1, ChronoUnit.DAYS.between(r.getCheckInDate(), r.getCheckOutDate()));
            totalNightsSold += nights;
        }

        // ADR (Average Daily Rate) = Ingresos por Reservas / Noches Vendidas
        BigDecimal adr = totalNightsSold > 0
                ? totalReservationValue.divide(BigDecimal.valueOf(totalNightsSold), 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        // RevPAR (Revenue Per Available Room - ventana de 30 días)
        long availableRoomNights30d = totalRooms * 30;
        BigDecimal revPar = availableRoomNights30d > 0
                ? totalReservationValue.divide(BigDecimal.valueOf(availableRoomNights30d), 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        BigDecimal totalCollected = paymentRepository.sumTotalCompletedRevenue();
        BigDecimal totalPending = totalReservationValue.subtract(totalCollected).max(BigDecimal.ZERO);

        long activeNowCount = activeReservations.stream()
                .filter(r -> r.getStatus() == ReservationStatus.CONFIRMED || r.getStatus() == ReservationStatus.CHECKED_IN)
                .count();

        List<RoomType> types = roomTypeRepository.findAll();
        List<CategoryMetricDTO> categoryBreakdown = types.stream().map(rt -> {
            List<Room> catRooms = rooms.stream()
                    .filter(r -> r.getRoomType().getId().equals(rt.getId()))
                    .toList();
            long catTotal = catRooms.size();
            long catOccupied = catRooms.stream().filter(r -> r.getStatus() == RoomStatus.OCCUPIED).count();
            long catAvailable = catRooms.stream().filter(r -> r.getStatus() == RoomStatus.AVAILABLE).count();
            BigDecimal catOccPct = catTotal > 0
                    ? BigDecimal.valueOf(catOccupied * 100.0 / catTotal).setScale(2, RoundingMode.HALF_UP)
                    : BigDecimal.ZERO;
            return new CategoryMetricDTO(rt.getName(), rt.getBasePrice(), catTotal, catOccupied, catAvailable, catOccPct);
        }).toList();

        return new DashboardMetricsDTO(
                totalRooms,
                occupiedRooms,
                availableRooms,
                unavailableRooms,
                occupancyRatePct,
                adr,
                revPar,
                totalCollected,
                totalPending,
                activeNowCount,
                categoryBreakdown
        );
    }
}
