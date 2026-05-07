package com.vn.ecommerce_backend.service.impl;

import com.vn.ecommerce_backend.common.constant.security.CustomUserDetails;
import com.vn.ecommerce_backend.common.constant.security.TokenType;
import com.vn.ecommerce_backend.dto.request.LoginRequest;
import com.vn.ecommerce_backend.dto.request.RegisterRequest;
import com.vn.ecommerce_backend.dto.request.VerifyEmailRequest;
import com.vn.ecommerce_backend.dto.response.TokenResponse;
import com.vn.ecommerce_backend.entity.User;
import com.vn.ecommerce_backend.entity.UserHasRole;
import com.vn.ecommerce_backend.entity.VerificationToken;
import com.vn.ecommerce_backend.exception.AppException;
import com.vn.ecommerce_backend.exception.ErrorCode;
import com.vn.ecommerce_backend.repository.UserHasRoleRepository;
import com.vn.ecommerce_backend.repository.UserRepository;
import com.vn.ecommerce_backend.repository.VerificationTokenRepository;
import com.vn.ecommerce_backend.service.*;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

@Service
@Slf4j(topic = "Auth-Service")
public class AuthServiceImpl implements AuthService {

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    @Value("${jwt.refresh-expiration}")
    private long refreshExpiration;

    private final UserRepository userRepository;
    private final VerificationTokenRepository tokenRepository;
    private final UserHasRoleRepository userHasRoleRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final RoleService roleService;
    private final RefreshTokenService refreshTokenService;

    public AuthServiceImpl(
            UserRepository userRepository,
            VerificationTokenRepository tokenRepository, UserHasRoleRepository userHasRoleRepository,
            PasswordEncoder passwordEncoder,
            EmailService emailService,
            AuthenticationManager authenticationManager,
            JwtService jwtService, RoleService roleService, RefreshTokenService refreshTokenService) {
        this.userRepository = userRepository;
        this.tokenRepository = tokenRepository;
        this.userHasRoleRepository = userHasRoleRepository;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
        this.roleService = roleService;
        this.refreshTokenService = refreshTokenService;
    }

    @Override
    @Transactional(rollbackFor = AppException.class)
    public void register(RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new AppException(ErrorCode.USER_ALREADY_EXISTS);
        }

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new AppException(ErrorCode.EMAIL_ALREADY_EXISTS);
        }

        User user = new User();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setFullName(request.getFullName());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setDateOfBirth(request.getDateOfBirth());
        user.setPhone(request.getPhone());
        userRepository.save(user);

        UserHasRole userHasRole = new UserHasRole();
        userHasRole.setUser(user);
        userHasRole.setRole(roleService.getDefaultRole());
        userHasRole.setAssignedAt(LocalDateTime.now());
        userHasRole.setAssignedBy("Admin System");
        userHasRoleRepository.save(userHasRole);

        String code = generateVerificationCode();

        VerificationToken vToken = new VerificationToken();
        vToken.setToken(code);
        vToken.setUser(user);
        vToken.setExpiryDate(LocalDateTime.now().plusMinutes(15));
        tokenRepository.save(vToken);

        emailService.sendVerificationEmail(user.getEmail(), user.getFullName(), code);
    }

    @Override
    @Transactional(rollbackFor = AppException.class)
    public void verifyEmail(VerifyEmailRequest request) {
        VerificationToken vToken = tokenRepository.findByToken(request.getCode())
                .orElseThrow(() -> new AppException(ErrorCode.INVALID_TOKEN));

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        if (vToken.getExpiryDate().isBefore(LocalDateTime.now()) || vToken.isUsed()) {
            throw new AppException(ErrorCode.TOKEN_EXPIRED);
        }

        user.setActive(true);
        user.setEmailVerified(true);

        vToken.setUser(user);
        vToken.setUsed(true);
    }

    @Override
    @Transactional(rollbackFor = AppException.class)
    public void resendVerificationEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        if (user.isEmailVerified()) {
            throw new AppException(ErrorCode.EMAIL_ALREADY_VERIFIED);
        }

        List<VerificationToken> tokens = tokenRepository.findAllByUserId(user.getId());
        tokens.forEach(t -> {
            t.setUsed(true);
            tokenRepository.save(t);
        });

        String newCode = generateVerificationCode();

        VerificationToken vToken = new VerificationToken();
        vToken.setToken(newCode);
        vToken.setUser(user);
        vToken.setExpiryDate(LocalDateTime.now().plusMinutes(15));
        tokenRepository.save(vToken);

        emailService.sendVerificationEmail(user.getEmail(), user.getFullName(), newCode);
    }

    @Override
    public TokenResponse login(LoginRequest request, HttpServletResponse response) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.getUsername(),
                            request.getPassword()
                    ));

            CustomUserDetails customUserDetails = (CustomUserDetails) authentication.getPrincipal();

            return generateTokensAndSetCookieAndRedis(customUserDetails, response);

        } catch (AuthenticationException ex) {
            log.error("Login failed for user: {}", request.getUsername());
            throw new AppException(ErrorCode.LOGIN_FAILED);
        }
    }

    @Override
    public TokenResponse refresh(HttpServletRequest request, HttpServletResponse response) {
        String refreshToken = extractRefreshTokenFromCookie(request);

        if (refreshToken == null) {
            throw new AppException(ErrorCode.REFRESH_TOKEN_NOT_FOUND);
        }

        try {
            String userIdStr = jwtService.extractSubject(refreshToken, TokenType.REFRESH_TOKEN);
            Long userId = Long.parseLong(userIdStr);

            if (!refreshTokenService.isValid(userId, refreshToken)) {
                throw new AppException(ErrorCode.REFRESH_TOKEN_EXPIRED);
            }

            refreshTokenService.revoke(userId);

            User user = userRepository.findUserWithRolesAndPermissions(userId)
                    .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

            CustomUserDetails customUserDetails = mapToCustomUserDetails(user);

            return generateTokensAndSetCookieAndRedis(customUserDetails, response);

        } catch (NumberFormatException e) {
            log.error("Invalid userId in refresh token");
            throw new AppException(ErrorCode.INVALID_TOKEN);
        } catch (Exception e) {
            log.error("Refresh token failed: {}", e.getMessage());
            throw new AppException(ErrorCode.REFRESH_TOKEN_FAILED);
        }
    }

    private String generateVerificationCode() {
        return String.format("%06d", SECURE_RANDOM.nextInt(1000000));
    }

    private String extractRefreshTokenFromCookie(HttpServletRequest request) {
        if (request.getCookies() == null) {
            return null;
        }
        return Arrays.stream(request.getCookies())
                .filter(cookie -> "refresh_token".equals(cookie.getName()))
                .map(Cookie::getValue)
                .findFirst()
                .orElse(null);
    }

    private TokenResponse generateTokensAndSetCookieAndRedis(CustomUserDetails user, HttpServletResponse response) {
        String accessToken = jwtService.generateAccessToken(user);
        String refreshToken = jwtService.generateRefreshToken(user);

        refreshTokenService.saveOrUpdate(user.getId(), refreshToken);

        ResponseCookie refreshCookie = ResponseCookie.from("refresh_token", refreshToken)
                .httpOnly(true)
                .secure(true)
                .path("/")
                .sameSite("Lax")
                .maxAge(Duration.ofMillis(refreshExpiration))
                .build();

        response.addHeader(HttpHeaders.SET_COOKIE, refreshCookie.toString());

        return TokenResponse.builder()
                .access_token(accessToken)
                .build();
    }

    private CustomUserDetails mapToCustomUserDetails(User user) {
        List<String> permissions = user.getRoles().stream()
                .map(UserHasRole::getRole)
                .flatMap(role -> role.getPermissions().stream())
                .map(rhp -> rhp.getPermission().getCode())
                .distinct()
                .toList();

        return CustomUserDetails.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .password(user.getPassword())
                .active(user.isActive())
                .roles(user.getRoleList())
                .permissions(permissions)
                .build();
    }
}
