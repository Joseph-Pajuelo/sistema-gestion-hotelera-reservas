package com.hotel.management.config;

import com.hotel.management.model.*;
import com.hotel.management.model.enums.PaymentMethod;
import com.hotel.management.model.enums.ReservationStatus;
import com.hotel.management.model.enums.RoomStatus;
import com.hotel.management.repository.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Configuration
public class DataSeederConfig {

    @Bean
    CommandLineRunner initDatabaseIfEmpty(
            RoomTypeRepository roomTypeRepository,
            RoomRepository roomRepository,
            GuestRepository guestRepository,
            ReservationRepository reservationRepository,
            PaymentRepository paymentRepository
    ) {
        return args -> {
            if (roomTypeRepository.count() > 0) {
                return;
            }

            RoomType standard = roomTypeRepository.save(new RoomType(
                    "Standard Simple",
                    "Habitación individual ejecutiva con escritorio ergonómico y Wi-Fi de alta velocidad.",
                    new BigDecimal("150.00"), 1
            ));
            RoomType doble = roomTypeRepository.save(new RoomType(
                    "Doble Superior",
                    "Habitación con cama Queen o dos camas de 2 plazas, vista panorámica y minibar.",
                    new BigDecimal("240.00"), 2
            ));
            RoomType suiteEjecutiva = roomTypeRepository.save(new RoomType(
                    "Suite Ejecutiva",
                    "Suite amplia con cama King, sala independiente, hidromasaje y desayuno incluido.",
                    new BigDecimal("380.00"), 3
            ));
            RoomType suitePresidencial = roomTypeRepository.save(new RoomType(
                    "Suite Presidencial",
                    "Piso alto con vista 360°, comedor privado, jacuzzi y atención preferencial 24/7.",
                    new BigDecimal("650.00"), 4
            ));

            Room r101 = roomRepository.save(new Room("101", 1, standard, RoomStatus.OCCUPIED));
            Room r102 = roomRepository.save(new Room("102", 1, standard, RoomStatus.AVAILABLE));
            Room r103 = roomRepository.save(new Room("103", 1, standard, RoomStatus.AVAILABLE));
            Room r201 = roomRepository.save(new Room("201", 2, doble, RoomStatus.OCCUPIED));
            Room r202 = roomRepository.save(new Room("202", 2, doble, RoomStatus.AVAILABLE));
            Room r203 = roomRepository.save(new Room("203", 2, doble, RoomStatus.CLEANING));
            Room r301 = roomRepository.save(new Room("301", 3, suiteEjecutiva, RoomStatus.OCCUPIED));
            Room r302 = roomRepository.save(new Room("302", 3, suiteEjecutiva, RoomStatus.AVAILABLE));
            Room r303 = roomRepository.save(new Room("303", 3, suiteEjecutiva, RoomStatus.MAINTENANCE));
            Room r401 = roomRepository.save(new Room("401", 4, suitePresidencial, RoomStatus.AVAILABLE));

            Guest g1 = guestRepository.save(new Guest("DNI", "74829103", "Carlos", "Mendoza Ríos", "carlos.mendoza@empresa.pe", "+51 987654321"));
            Guest g2 = guestRepository.save(new Guest("DNI", "46192837", "Valeria", "Gómez Paredes", "valeria.gomez@correo.com", "+51 912345678"));
            Guest g3 = guestRepository.save(new Guest("PASSPORT", "US8839201", "Michael", "Thornton", "m.thornton@globalcorp.com", "+1 4158902341"));
            Guest g4 = guestRepository.save(new Guest("DNI", "71029384", "Lucía", "Fernández Soto", "lucia.fernandez@utp.edu.pe", "+51 998877665"));

            LocalDate today = LocalDate.now();

            Reservation res1 = new Reservation();
            res1.setReservationCode("RES-2026-0001");
            res1.setGuest(g1);
            res1.setRoom(r101);
            res1.setCheckInDate(today.minusDays(2));
            res1.setCheckOutDate(today.plusDays(2));
            res1.setStatus(ReservationStatus.CHECKED_IN);
            res1.setTotalAmount(new BigDecimal("600.00"));
            res1.setNotes("Viaje corporativo - Cliente frecuente");
            reservationRepository.save(res1);

            Reservation res2 = new Reservation();
            res2.setReservationCode("RES-2026-0002");
            res2.setGuest(g2);
            res2.setRoom(r201);
            res2.setCheckInDate(today.minusDays(1));
            res2.setCheckOutDate(today.plusDays(3));
            res2.setStatus(ReservationStatus.CHECKED_IN);
            res2.setTotalAmount(new BigDecimal("960.00"));
            res2.setNotes("Adelanto del 50% abonado");
            reservationRepository.save(res2);

            Reservation res3 = new Reservation();
            res3.setReservationCode("RES-2026-0003");
            res3.setGuest(g3);
            res3.setRoom(r301);
            res3.setCheckInDate(today.minusDays(1));
            res3.setCheckOutDate(today.plusDays(4));
            res3.setStatus(ReservationStatus.CHECKED_IN);
            res3.setTotalAmount(new BigDecimal("1900.00"));
            res3.setNotes("Huésped VIP - Traslado aeropuerto");
            reservationRepository.save(res3);

            Reservation res4 = new Reservation();
            res4.setReservationCode("RES-2026-0004");
            res4.setGuest(g4);
            res4.setRoom(r401);
            res4.setCheckInDate(today.plusDays(3));
            res4.setCheckOutDate(today.plusDays(6));
            res4.setStatus(ReservationStatus.CONFIRMED);
            res4.setTotalAmount(new BigDecimal("1950.00"));
            res4.setNotes("Reserva futura confirmada");
            reservationRepository.save(res4);

            Payment p1 = new Payment();
            p1.setReservation(res1);
            p1.setAmount(new BigDecimal("600.00"));
            p1.setPaymentMethod(PaymentMethod.CREDIT_CARD);
            p1.setPaymentStatus("COMPLETED");
            p1.setTransactionReference("VISA-992011");

            Payment p2 = new Payment();
            p2.setReservation(res2);
            p2.setAmount(new BigDecimal("480.00"));
            p2.setPaymentMethod(PaymentMethod.YAPE_PLIN);
            p2.setPaymentStatus("COMPLETED");
            p2.setTransactionReference("YAPE-772819");

            Payment p3 = new Payment();
            p3.setReservation(res3);
            p3.setAmount(new BigDecimal("1200.00"));
            p3.setPaymentMethod(PaymentMethod.TRANSFER);
            p3.setPaymentStatus("COMPLETED");
            p3.setTransactionReference("BCP-883920");

            paymentRepository.saveAll(List.of(p1, p2, p3));
        };
    }
}
