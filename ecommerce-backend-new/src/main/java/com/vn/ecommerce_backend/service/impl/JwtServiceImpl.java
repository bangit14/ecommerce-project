package com.vn.ecommerce_backend.service.impl;

import com.vn.ecommerce_backend.common.constant.security.CustomUserDetails;
import com.vn.ecommerce_backend.common.constant.security.TokenType;
import com.vn.ecommerce_backend.exception.AppException;
import com.vn.ecommerce_backend.exception.ErrorCode;
import com.vn.ecommerce_backend.service.JwtService;
import io.jsonwebtoken.*;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.time.LocalDate;
import java.util.*;
import java.util.function.Function;

@Service
@Slf4j
public class JwtServiceImpl implements JwtService {

    @Value("${jwt.access-secret}")
    private String accessSecret;

    @Value("${jwt.refresh-secret}")
    private String refreshSecret;

    @Value("${jwt.access-expiration}")
    private Long accessExpiration;

    @Value("${jwt.refresh-expiration}")
    private Long refreshExpiration;

    @Value("${jwt.issuer}")
    private String issuer;

    private static final String USER_ID_CLAIM = "userId";
    private static final String FULL_NAME_CLAIM = "fullName";
    private static final String EMAIL_CLAIM = "email";
    private static final String PHONE_CLAIM = "phone";
    private static final String DOB_CLAIM = "dob";
    private static final String ENABLED_CLAIM = "enabled";
    private static final String EMAIL_VERIFIED_CLAIM = "emailVerified";
    private static final String ROLES_CLAIM = "roles";
    private static final String TOKEN_TYPE_CLAIM = "typ";
    private static final String PERMISSIONS_CLAIM = "permissions";

    private SecretKey getAccessKey() {
        return Keys.hmacShaKeyFor(Decoders.BASE64.decode(accessSecret));
    }

    private SecretKey getRefreshKey() {
        return Keys.hmacShaKeyFor(Decoders.BASE64.decode(refreshSecret));
    }

    @Override
    public String generateAccessToken(CustomUserDetails userDetails) {
        log.debug("Generating access token for userId: {}", userDetails.getId());

        return Jwts.builder()
                .subject(userDetails.getUsername())
                .claim(USER_ID_CLAIM, userDetails.getId())
                .claim(FULL_NAME_CLAIM, userDetails.getFullName())
                .claim(EMAIL_CLAIM, userDetails.getEmail())
                .claim(ROLES_CLAIM, userDetails.getRoles())
                .claim(PERMISSIONS_CLAIM, userDetails.getPermissions())
                .claim(TOKEN_TYPE_CLAIM, "access")
                .issuer(issuer)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + accessExpiration))
                .signWith(getAccessKey(), Jwts.SIG.HS512)
                .compact();
    }

    @Override
    public String generateRefreshToken(CustomUserDetails userDetails) {
        return generateRefreshToken(userDetails.getId().toString());
    }

    private String generateRefreshToken(String subject) {
        log.debug("Generating refresh token for user: {}", subject);

        return Jwts.builder()
                .subject(subject)
                .claim(TOKEN_TYPE_CLAIM, "refresh")
                .issuer(issuer)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + refreshExpiration))
                .signWith(getRefreshKey(), Jwts.SIG.HS256)
                .compact();
    }

    @Override
    public CustomUserDetails extractUserDetailsFromToken(String token) {
        Claims claims = extractAllClaims(token, TokenType.ACCESS_TOKEN);

        @SuppressWarnings("unchecked")
        List<String> roles = claims.get(ROLES_CLAIM, List.class);
        @SuppressWarnings("unchecked")
        List<String> permissions = claims.get(PERMISSIONS_CLAIM, List.class);

        return CustomUserDetails.builder()
                .id(claims.get(USER_ID_CLAIM, Long.class))
                .username(claims.getSubject())
                .email(claims.get(EMAIL_CLAIM, String.class))
                .fullName(claims.get(FULL_NAME_CLAIM, String.class))
                .roles(roles != null ? roles : List.of())
                .permissions(permissions != null ? permissions : List.of())
                .active(true)
                .build();
    }

    @Override
    public String extractUsername(String token, TokenType tokenType) {
        return extractClaim(token, tokenType, Claims::getSubject);
    }

    @Override
    public String extractSubject(String token, TokenType tokenType) {
        return extractClaim(token, tokenType, Claims::getSubject);
    }

    @Override
    public boolean isTokenValid(String token, TokenType tokenType, UserDetails userDetails) {
        try {
            final String username = extractUsername(token, tokenType);
            final String tokenTypeClaim = extractClaim(token, tokenType,
                    claims -> claims.get(TOKEN_TYPE_CLAIM, String.class));

            return username.equals(userDetails.getUsername())
                    && tokenTypeClaim != null
                    && tokenTypeClaim.equals(mapTokenTypeClaim(tokenType))
                    && !isTokenExpired(token, tokenType);

        } catch (Exception e) {
            log.debug("Token validation failed: {}", e.getMessage());
            return false;
        }
    }

    @Override
    public boolean isTokenExpired(String token, TokenType tokenType) {
        try {
            Date expiration = extractClaim(token, tokenType, Claims::getExpiration);
            return expiration.before(new Date());
        } catch (Exception e) {
            return true;
        }
    }

    private <T> T extractClaim(String token, TokenType tokenType, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token, tokenType);
        return claimsResolver.apply(claims);
    }

    private Claims extractAllClaims(String token, TokenType tokenType) {
        SecretKey key = getSigningKey(tokenType);

        try {
            return Jwts.parser()
                    .verifyWith(key)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
        } catch (ExpiredJwtException e) {
            throw new AppException(ErrorCode.TOKEN_EXPIRED);
        } catch (JwtException | IllegalArgumentException e) {
            throw new AppException(ErrorCode.INVALID_TOKEN);
        }
    }


    private SecretKey getSigningKey(TokenType tokenType) {
        return switch (tokenType) {
            case ACCESS_TOKEN -> getAccessKey();
            case REFRESH_TOKEN -> getRefreshKey();
            default -> throw new AppException(ErrorCode.TOKEN_TYPE_NOT_SUPPORTED);
        };
    }

    private String mapTokenTypeClaim(TokenType tokenType) {
        return switch (tokenType) {
            case ACCESS_TOKEN -> "access";
            case REFRESH_TOKEN -> "refresh";
            default -> throw new AppException(ErrorCode.TOKEN_TYPE_NOT_SUPPORTED);
        };
    }
}
