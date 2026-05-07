package com.vn.ecommerce_backend.service.impl;

import com.vn.ecommerce_backend.entity.User;
import com.vn.ecommerce_backend.entity.VerificationToken;
import com.vn.ecommerce_backend.exception.AppException;
import com.vn.ecommerce_backend.exception.ErrorCode;
import com.vn.ecommerce_backend.repository.VerificationTokenRepository;
import com.vn.ecommerce_backend.service.VerificationTokenService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class VerificationServiceImpl implements VerificationTokenService {

    private final VerificationTokenRepository tokenRepository;

    @Value("${app.email.verification-expiry-minutes}")
    private int expiryMinutes;

    public VerificationServiceImpl(VerificationTokenRepository tokenRepository) {
        this.tokenRepository = tokenRepository;
    }


    @Override
    @Transactional
    public String createVerificationToken(User user) {
        tokenRepository.deleteByUserId(user.getId());

        String token = UUID.randomUUID().toString();

        VerificationToken verificationToken = VerificationToken.builder()
                .token(token)
                .user(user)
                .expiryDate(LocalDateTime.now().plusMinutes(expiryMinutes))
                .build();

        tokenRepository.save(verificationToken);

        return token;
    }

    @Override
    @Transactional
    public VerificationToken validateAndGetToken(String token) {
        VerificationToken verificationToken = tokenRepository.findByToken(token)
                .orElseThrow(() -> new AppException(ErrorCode.INVALID_TOKEN));

        if (verificationToken.isExpired()) {
            throw new AppException(ErrorCode.TOKEN_EXPIRED);
        }

        if (verificationToken.isUsed()) {
            throw new AppException(ErrorCode.TOKEN_USED);
        }

        return verificationToken;
    }

    @Override
    @Transactional
    public void markTokenAsUsed(VerificationToken token) {
        token.setUsed(true);
        tokenRepository.save(token);
    }

    @Override
    @Transactional
    public void deleteVerificationToken(VerificationToken token) {
        tokenRepository.delete(token);
    }

    @Override
    @Transactional
    @Scheduled(cron = "0 0 * * * *")
    public void cleanExpiredTokens() {
        tokenRepository.deleteExpiredOrUsedTokens(LocalDateTime.now());
    }
}
