package com.hotel.management.service;

import com.hotel.management.dto.RoomResponseDTO;
import com.hotel.management.exception.ResourceNotFoundException;
import com.hotel.management.model.Room;
import com.hotel.management.model.enums.RoomStatus;
import com.hotel.management.repository.RoomRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
public class RoomService {

    private final RoomRepository roomRepository;

    public RoomService(RoomRepository roomRepository) {
        this.roomRepository = roomRepository;
    }

    @Transactional(readOnly = true)
    public List<RoomResponseDTO> getAllRooms() {
        return roomRepository.findAllByOrderByRoomNumberAsc().stream()
                .map(this::toDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<RoomResponseDTO> getAvailableRooms(LocalDate checkIn, LocalDate checkOut) {
        if (!checkOut.isAfter(checkIn)) {
            throw new IllegalArgumentException("La fecha de salida debe ser posterior a la fecha de ingreso.");
        }
        return roomRepository.findAvailableRoomsForDates(checkIn, checkOut).stream()
                .map(this::toDTO)
                .toList();
    }

    @Transactional
    public RoomResponseDTO updateRoomStatus(Long roomId, RoomStatus newStatus) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new ResourceNotFoundException("Habitación no encontrada con ID: " + roomId));
        room.setStatus(newStatus);
        return toDTO(roomRepository.save(room));
    }

    private RoomResponseDTO toDTO(Room r) {
        return new RoomResponseDTO(
                r.getId(),
                r.getRoomNumber(),
                r.getFloor(),
                r.getRoomType().getName(),
                r.getRoomType().getDescription(),
                r.getRoomType().getBasePrice(),
                r.getRoomType().getMaxCapacity(),
                r.getStatus()
        );
    }
}
