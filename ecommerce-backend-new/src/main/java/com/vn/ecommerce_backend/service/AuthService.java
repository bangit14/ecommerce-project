package com.vn.ecommerce_backend.service;

import com.vn.ecommerce_backend.dto.request.LoginRequest;
import com.vn.ecommerce_backend.dto.request.RegisterRequest;
import com.vn.ecommerce_backend.dto.request.VerifyEmailRequest;
import com.vn.ecommerce_backend.dto.response.TokenResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Service;

@Service
public interface AuthService {
    public void register(RegisterRequest request);

    public TokenResponse login(LoginRequest request, HttpServletResponse response);

    public TokenResponse refresh(HttpServletRequest request, HttpServletResponse response);

    public void verifyEmail(VerifyEmailRequest request);

    public void resendVerificationEmail(String email);
}
