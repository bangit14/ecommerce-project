package com.vn.ecommerce_backend.repository;

import com.vn.ecommerce_backend.entity.VerificationToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface VerificationTokenRepository extends JpaRepository<VerificationToken, Long> {

    Optional<VerificationToken> findByToken(String token);

    @Modifying
    @Query("DELETE FROM VerificationToken vt WHERE vt.expiryDate < :now OR vt.used = true")
    void deleteExpiredOrUsedTokens(LocalDateTime now);

    // Optional: xóa token cũ của user trước khi tạo mới
    @Modifying
    @Query("DELETE FROM VerificationToken vt WHERE vt.user.id = :userId")
    void deleteByUserId(Long userId);

    List<VerificationToken> findAllByUserId(Long userId);
}
