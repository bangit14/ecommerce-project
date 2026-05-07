package com.vn.ecommerce_backend.dto.response;

import lombok.Builder;

import java.time.LocalDateTime;

@Builder
public class ApiErrorResponse {
    private String message;
    private int status;
    private String error;
    private LocalDateTime timestamp;

    public String getMessage() {
        return message;
    }

    public int getStatus() {
        return status;
    }

    public String getError() {
        return error;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }
}
