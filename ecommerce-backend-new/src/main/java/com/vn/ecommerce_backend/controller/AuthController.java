package com.vn.ecommerce_backend.controller;

import com.vn.ecommerce_backend.dto.request.LoginRequest;
import com.vn.ecommerce_backend.dto.request.RefreshTokenRequest;
import com.vn.ecommerce_backend.dto.request.RegisterRequest;
import com.vn.ecommerce_backend.dto.request.VerifyEmailRequest;
import com.vn.ecommerce_backend.dto.response.TokenResponse;
import com.vn.ecommerce_backend.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        authService.register(request);
        return ResponseEntity.ok("Đăng ký thành công. Vui lòng kiểm tra email để xác thực.");
    }

    @PostMapping("/resend-verification")
    public ResponseEntity<?> resend(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        authService.resendVerificationEmail(email);
        return ResponseEntity.ok("Đã gửi lại email xác thực.");
    }

    @PostMapping("/verify-code")
    public ResponseEntity<?> verifyCode(@RequestBody VerifyEmailRequest request) {
        authService.verifyEmail(request);
        return ResponseEntity.ok("Xác thực thành công! Bạn có thể đăng nhập.");
    }

    @PostMapping("/login")
    public ResponseEntity<TokenResponse> login(@RequestBody LoginRequest request, HttpServletResponse response) {
        return ResponseEntity.ok(authService.login(request,response));
    }

    @PostMapping("/refresh")
    public ResponseEntity<TokenResponse> refresh(HttpServletRequest request, HttpServletResponse response) {
        return ResponseEntity.ok(authService.refresh(request,response));
    }
}
