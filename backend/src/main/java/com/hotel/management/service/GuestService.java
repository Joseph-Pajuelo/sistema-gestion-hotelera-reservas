package com.hotel.management.service;

import com.hotel.management.dto.GuestRequestDTO;
import com.hotel.management.dto.GuestResponseDTO;
import com.hotel.management.model.Guest;
import com.hotel.management.repository.GuestRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class GuestService {

    private final GuestRepository guestRepository;

    public GuestService(GuestRepository guestRepository) {
        this.guestRepository = guestRepository;
    }

    @Transactional(readOnly = true)
    public List<GuestResponseDTO> getAllGuests() {
        return guestRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::toDTO)
                .toList();
    }

    @Transactional
    public GuestResponseDTO createGuest(GuestRequestDTO request) {
        if (guestRepository.findByDocumentNumber(request.documentNumber()).isPresent()) {
            throw new IllegalArgumentException("Ya existe un huésped registrado con el documento: " + request.documentNumber());
        }
        Guest guest = new Guest(
                request.documentType().toUpperCase(),
                request.documentNumber().trim(),
                request.firstName().trim(),
                request.lastName().trim(),
                request.email().trim().toLowerCase(),
                request.phone()
        );
        return toDTO(guestRepository.save(guest));
    }

    private GuestResponseDTO toDTO(Guest g) {
        return new GuestResponseDTO(
                g.getId(),
                g.getDocumentType(),
                g.getDocumentNumber(),
                g.getFirstName(),
                g.getLastName(),
                g.getEmail(),
                g.getPhone(),
                g.getCreatedAt()
        );
    }
}
