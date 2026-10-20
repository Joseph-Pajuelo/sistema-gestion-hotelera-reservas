package com.hotel.management.controller;

import com.hotel.management.dto.PaymentRequestDTO;
import com.hotel.management.dto.PaymentResponseDTO;
import com.hotel.management.service.PaymentService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @GetMapping
    public ResponseEntity<List<PaymentResponseDTO>> getAllPayments() {
        return ResponseEntity.ok(paymentService.getAllPayments());
    }

    @PostMapping
    public ResponseEntity<PaymentResponseDTO> registerPayment(
            @Valid @RequestBody PaymentRequestDTO request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(paymentService.registerPayment(request));
    }
}
