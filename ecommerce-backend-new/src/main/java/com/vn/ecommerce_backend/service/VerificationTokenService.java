package com.vn.ecommerce_backend.service;

import com.vn.ecommerce_backend.entity.User;
import com.vn.ecommerce_backend.entity.VerificationToken;

public interface VerificationTokenService {
    String createVerificationToken(User user);

    VerificationToken validateAndGetToken(String token);

    void markTokenAsUsed(VerificationToken token);

    void deleteVerificationToken(VerificationToken token);

    void cleanExpiredTokens();
}
