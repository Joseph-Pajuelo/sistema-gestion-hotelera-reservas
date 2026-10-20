package com.hotel.management.controller;

import com.hotel.management.dto.ReservationRequestDTO;
import com.hotel.management.dto.ReservationResponseDTO;
import com.hotel.management.model.enums.ReservationStatus;
import com.hotel.management.service.ReservationService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reservations")
public class ReservationController {

    private final ReservationService reservationService;

    public ReservationController(ReservationService reservationService) {
        this.reservationService = reservationService;
    }

    @GetMapping
    public ResponseEntity<List<ReservationResponseDTO>> getAllReservations() {
        return ResponseEntity.ok(reservationService.getAllReservations());
    }

    @PostMapping
    public ResponseEntity<ReservationResponseDTO> createReservation(
            @Valid @RequestBody ReservationRequestDTO request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(reservationService.createReservation(request));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ReservationResponseDTO> updateReservationStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> payload
    ) {
        ReservationStatus newStatus = ReservationStatus.valueOf(payload.get("status").toUpperCase());
        return ResponseEntity.ok(reservationService.updateReservationStatus(id, newStatus));
    }
}
