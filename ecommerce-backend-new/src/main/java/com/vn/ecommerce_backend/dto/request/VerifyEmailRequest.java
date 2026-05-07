package com.vn.ecommerce_backend.dto.request;

public class VerifyEmailRequest {
    private String email;
    private String code;

    public String getEmail() {
        return email;
    }

    public String getCode() {
        return code;
    }
}
