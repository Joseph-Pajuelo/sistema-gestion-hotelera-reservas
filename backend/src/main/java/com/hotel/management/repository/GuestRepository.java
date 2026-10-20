package com.hotel.management.repository;

import com.hotel.management.model.Guest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GuestRepository extends JpaRepository<Guest, Long> {

    Optional<Guest> findByDocumentNumber(String documentNumber);

    Optional<Guest> findByEmailIgnoreCase(String email);

    List<Guest> findAllByOrderByCreatedAtDesc();
}
