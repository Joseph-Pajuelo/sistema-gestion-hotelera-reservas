package com.hotel.management;

import com.hotel.management.dto.ReservationRequestDTO;
import com.hotel.management.exception.OverbookingConflictException;
import com.hotel.management.model.Room;
import com.hotel.management.repository.RoomRepository;
import com.hotel.management.service.ReservationService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.time.LocalDate;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.assertEquals;

@SpringBootTest
@ActiveProfiles("local")
class ConcurrencyOverbookingTest {

    @Autowired
    private ReservationService reservationService;

    @Autowired
    private RoomRepository roomRepository;

    @Test
    @DisplayName("Debe permitir solo 1 reserva cuando 2 hilos concurrentes intentan reservar la misma habitación y fechas")
    void shouldPreventOverbookingUnderConcurrentRequests() throws InterruptedException {
        // Buscamos la habitación 102 (AVAILABLE) creada por DataSeederConfig
        Room targetRoom = roomRepository.findAll().stream()
                .filter(r -> "102".equals(r.getRoomNumber()))
                .findFirst()
                .orElseThrow();

        LocalDate checkIn = LocalDate.now().plusDays(15);
        LocalDate checkOut = LocalDate.now().plusDays(18);

        int threads = 2;
        ExecutorService executor = Executors.newFixedThreadPool(threads);
        CountDownLatch readyLatch = new CountDownLatch(threads);
        CountDownLatch startLatch = new CountDownLatch(1);
        CountDownLatch doneLatch = new CountDownLatch(threads);

        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger conflictCount = new AtomicInteger(0);

        for (int i = 0; i < threads; i++) {
            final long guestId = (i == 0) ? 1L : 2L;
            executor.submit(() -> {
                readyLatch.countDown();
                try {
                    // Ambos hilos esperan aquí para dispararse en el mismo milisegundo
                    startLatch.await();
                    ReservationRequestDTO req = new ReservationRequestDTO(
                            guestId,
                            targetRoom.getId(),
                            checkIn,
                            checkOut,
                            "Prueba de concurrencia"
                    );
                    reservationService.createReservation(req);
                    successCount.incrementAndGet();
                } catch (OverbookingConflictException ex) {
                    conflictCount.incrementAndGet();
                } catch (Exception ignored) {
                } finally {
                    doneLatch.countDown();
                }
            });
        }

        readyLatch.await();
        startLatch.countDown(); // ¡Disparo simultáneo de ambos hilos!
        doneLatch.await(10, TimeUnit.SECONDS);
        executor.shutdown();

        // Exactamente 1 hilo debe lograr la reserva y 1 hilo debe ser rechazado por Overbooking
        assertEquals(1, successCount.get(), "Exactamente una reserva debe completarse");
        assertEquals(1, conflictCount.get(), "La petición simultánea duplicada debe lanzar OverbookingConflictException");
    }
}
