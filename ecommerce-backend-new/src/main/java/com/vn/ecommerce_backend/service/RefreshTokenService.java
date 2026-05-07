package com.vn.ecommerce_backend.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.util.Set;
import java.util.concurrent.TimeUnit;

@Service
@Slf4j(topic = "Refresh-Token-Service")
public class RefreshTokenService {

    private static final String KEY_PREFIX = "refresh_token:";

    @Value("${jwt.refresh-expiration}")
    private long refreshExpiration;

    private StringRedisTemplate redisTemplate;

    public RefreshTokenService(StringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    /**
     * Lưu refresh token mới (và xóa token cũ nếu có)
     */
    public void saveOrUpdate(Long userId, String refreshToken) {
        String key = KEY_PREFIX + userId;

        redisTemplate.delete(key);

        redisTemplate.opsForValue().set(key, refreshToken, refreshExpiration, TimeUnit.SECONDS);

        log.debug("Saved refresh token for user: {}, expires in {}s", userId, refreshExpiration);
    }

    /**
     * Kiểm tra refresh token có hợp lệ không
     */
    public boolean isValid(Long userId, String refreshToken) {
        String key = KEY_PREFIX + userId;
        String storedToken = redisTemplate.opsForValue().get(key);

        if (storedToken == null) {
            return false;
        }

        return storedToken.equals(refreshToken);
    }

    /**
     * Xóa refresh token (khi logout hoặc revoke)
     */
    public void revoke(Long userId) {
        String key = KEY_PREFIX + userId;
        Boolean deleted = redisTemplate.delete(key);
        log.debug("Revoked refresh token for user: {}, deleted: {}", userId, deleted);
    }

    /**
     * Revoke all devices (logout mọi nơi)
     * Nếu bạn lưu thêm suffix deviceId thì có thể triển khai phức tạp hơn
     */
    public void revokeAll(Long userId) {
        String pattern = KEY_PREFIX + userId + "*";
        Set<String> keys = redisTemplate.keys(pattern);
        if (keys != null && !keys.isEmpty()) {
            redisTemplate.delete(keys);
            log.info("Revoked all refresh tokens for user: {}", userId);
        }
    }
}
