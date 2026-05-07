package com.vn.ecommerce_backend.service;

import com.vn.ecommerce_backend.common.constant.security.CustomUserDetails;
import com.vn.ecommerce_backend.common.constant.security.TokenType;
import org.springframework.security.core.userdetails.UserDetails;

public interface JwtService {
    String generateAccessToken(CustomUserDetails userDetails);

    String generateRefreshToken(CustomUserDetails userDetails);

    CustomUserDetails extractUserDetailsFromToken(String token);

    String extractSubject(String token, TokenType tokenType);

    String extractUsername(String token,TokenType tokenType);

    boolean isTokenValid(String token, TokenType tokenType, UserDetails userDetails);

    boolean isTokenExpired(String token, TokenType tokenType);
}
