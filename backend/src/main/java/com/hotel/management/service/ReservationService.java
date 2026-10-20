package com.hotel.management.service;

import com.hotel.management.dto.ReservationRequestDTO;
import com.hotel.management.dto.ReservationResponseDTO;
import com.hotel.management.exception.OverbookingConflictException;
import com.hotel.management.exception.ResourceNotFoundException;
import com.hotel.management.model.Guest;
import com.hotel.management.model.Reservation;
import com.hotel.management.model.Room;
import com.hotel.management.model.enums.ReservationStatus;
import com.hotel.management.model.enums.RoomStatus;
import com.hotel.management.repository.GuestRepository;
import com.hotel.management.repository.PaymentRepository;
import com.hotel.management.repository.ReservationRepository;
import com.hotel.management.repository.RoomRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

@Service
public class ReservationService {

    private final ReservationRepository reservationRepository;
    private final RoomRepository roomRepository;
    private final GuestRepository guestRepository;
    private final PaymentRepository paymentRepository;

    public ReservationService(
            ReservationRepository reservationRepository,
            RoomRepository roomRepository,
            GuestRepository guestRepository,
            PaymentRepository paymentRepository
    ) {
        this.reservationRepository = reservationRepository;
        this.roomRepository = roomRepository;
        this.guestRepository = guestRepository;
        this.paymentRepository = paymentRepository;
    }

    @Transactional(readOnly = true)
    public List<ReservationResponseDTO> getAllReservations() {
        return reservationRepository.findAllByOrderByCheckInDateDesc().stream()
                .map(this::toDTO)
                .toList();
    }

    /**
     * TRANSACCIÓN ATÓMICA CON PREVENCIÓN DE OVERBOOKING (PESSIMISTIC LOCKING):
     * 1. Abre una transacción ACID (@Transactional).
     * 2. Valida coherencia de fechas (checkOut > checkIn).
     * 3. Adquiere un BLOQUEO PESIMISTA (SELECT ... FOR UPDATE) sobre la fila de la habitación
     *    en PostgreSQL. Cualquier hilo concurrente que intente reservar la misma habitación
     *    esperará en cola hasta que esta transacción termine.
     * 4. Verifica si existe alguna reserva activa que se cruce con el rango [checkIn, checkOut).
     * 5. Calcula automáticamente el importe total (tarifa base * noches) y persiste la reserva.
     */
    @Transactional(isolation = Isolation.READ_COMMITTED)
    public ReservationResponseDTO createReservation(ReservationRequestDTO request) {
        long nights = ChronoUnit.DAYS.between(request.checkInDate(), request.checkOutDate());
        if (nights <= 0) {
            throw new IllegalArgumentException("La fecha de check-out debe ser al menos 1 día posterior al check-in.");
        }

        Guest guest = guestRepository.findById(request.guestId())
                .orElseThrow(() -> new ResourceNotFoundException("Huésped no encontrado con ID: " + request.guestId()));

        // PASO CRÍTICO DE CONCURRENCIA: Bloquea la fila de la habitación en la base de datos
        Room room = roomRepository.findByIdWithPessimisticLock(request.roomId())
                .orElseThrow(() -> new ResourceNotFoundException("Habitación no encontrada con ID: " + request.roomId()));

        if (room.getStatus() == RoomStatus.MAINTENANCE) {
            throw new OverbookingConflictException(
                    "La habitación " + room.getRoomNumber() + " se encuentra en mantenimiento y no admite reservas."
            );
        }

        // Con el lock adquirido, verificamos si existe solapamiento de fechas
        boolean hasOverlap = reservationRepository.existsOverlappingReservation(
                room.getId(),
                request.checkInDate(),
                request.checkOutDate()
        );

        if (hasOverlap) {
            throw new OverbookingConflictException(
                    String.format(
                            "Prevención de Overbooking: La habitación %s ya cuenta con una reserva activa entre %s y %s.",
                            room.getRoomNumber(),
                            request.checkInDate(),
                            request.checkOutDate()
                    )
            );
        }

        BigDecimal totalAmount = room.getRoomType().getBasePrice()
                .multiply(BigDecimal.valueOf(nights));

        Reservation reservation = new Reservation();
        reservation.setReservationCode("RES-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        reservation.setGuest(guest);
        reservation.setRoom(room);
        reservation.setCheckInDate(request.checkInDate());
        reservation.setCheckOutDate(request.checkOutDate());
        reservation.setStatus(ReservationStatus.CONFIRMED);
        reservation.setTotalAmount(totalAmount);
        reservation.setNotes(request.notes());

        Reservation saved = reservationRepository.save(reservation);
        return toDTO(saved);
    }

    /**
     * Actualiza el estado operativo de la reserva y sincroniza atómicamente el inventario
     * físico de la habitación (Check-In -> OCCUPIED, Check-Out -> CLEANING, Cancelación -> AVAILABLE).
     */
    @Transactional
    public ReservationResponseDTO updateReservationStatus(Long reservationId, ReservationStatus newStatus) {
        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new ResourceNotFoundException("Reserva no encontrada con ID: " + reservationId));

        Room room = roomRepository.findByIdWithPessimisticLock(reservation.getRoom().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Habitación asociada no encontrada"));

        reservation.setStatus(newStatus);
        reservation.setUpdatedAt(OffsetDateTime.now());

        switch (newStatus) {
            case CHECKED_IN -> room.setStatus(RoomStatus.OCCUPIED);
            case CHECKED_OUT -> room.setStatus(RoomStatus.CLEANING);
            case CANCELLED -> {
                if (room.getStatus() == RoomStatus.OCCUPIED) {
                    room.setStatus(RoomStatus.AVAILABLE);
                }
            }
            default -> { /* Mantiene el estado actual de la habitación */ }
        }

        roomRepository.save(room);
        return toDTO(reservationRepository.save(reservation));
    }

    public ReservationResponseDTO toDTO(Reservation r) {
        long nights = Math.max(1, ChronoUnit.DAYS.between(r.getCheckInDate(), r.getCheckOutDate()));
        BigDecimal paid = paymentRepository.sumCompletedPaymentsByReservationId(r.getId());
        BigDecimal pending = r.getTotalAmount().subtract(paid).max(BigDecimal.ZERO);

        return new ReservationResponseDTO(
                r.getId(),
                r.getReservationCode(),
                r.getGuest().getId(),
                r.getGuest().getFirstName() + " " + r.getGuest().getLastName(),
                r.getGuest().getDocumentType() + " " + r.getGuest().getDocumentNumber(),
                r.getRoom().getId(),
                r.getRoom().getRoomNumber(),
                r.getRoom().getRoomType().getName(),
                r.getCheckInDate(),
                r.getCheckOutDate(),
                nights,
                r.getStatus(),
                r.getTotalAmount(),
                paid,
                pending,
                r.getNotes(),
                r.getCreatedAt()
        );
    }
}
