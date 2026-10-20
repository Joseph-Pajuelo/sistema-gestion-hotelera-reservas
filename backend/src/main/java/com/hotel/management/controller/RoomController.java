package com.hotel.management.controller;

import com.hotel.management.dto.RoomResponseDTO;
import com.hotel.management.model.enums.RoomStatus;
import com.hotel.management.service.RoomService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/rooms")
public class RoomController {

    private final RoomService roomService;

    public RoomController(RoomService roomService) {
        this.roomService = roomService;
    }

    @GetMapping
    public ResponseEntity<List<RoomResponseDTO>> getAllRooms() {
        return ResponseEntity.ok(roomService.getAllRooms());
    }

    @GetMapping("/available")
    public ResponseEntity<List<RoomResponseDTO>> getAvailableRooms(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate checkIn,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate checkOut
    ) {
        return ResponseEntity.ok(roomService.getAvailableRooms(checkIn, checkOut));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<RoomResponseDTO> updateRoomStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> payload
    ) {
        RoomStatus newStatus = RoomStatus.valueOf(payload.get("status").toUpperCase());
        return ResponseEntity.ok(roomService.updateRoomStatus(id, newStatus));
    }
}
