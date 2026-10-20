package com.hotel.management.exception;

public class OverbookingConflictException extends RuntimeException {
    public OverbookingConflictException(String message) {
        super(message);
    }
}
