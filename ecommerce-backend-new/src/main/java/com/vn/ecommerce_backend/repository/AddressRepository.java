package com.vn.ecommerce_backend.repository;

import com.vn.ecommerce_backend.entity.Address;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

public interface AddressRepository extends JpaRepository<Address, Long> {

    @Query("SELECT a FROM Address a WHERE a.user.id = :userId ORDER BY a.isDefault DESC, a.created_at ASC")
    List<Address> findByUserIdOrderByIsDefaultDescCreatedAtAsc(Long userId);

    Optional<Address> findByIdAndUserId(Long id, Long userId);

    @Query("SELECT a FROM Address a WHERE a.user.id = :userId AND a.isDefault = true")
    Optional<Address> findDefaultAddressByUserId(@Param("userId") Long userId);

    @Transactional
    @Modifying
    @Query("UPDATE Address a SET a.isDefault = false WHERE a.user.id = :userId")
    void resetAllDefaultAddresses(@Param("userId") Long userId);

    @Query("SELECT a FROM Address a WHERE a.user.id = :userId AND a.isDefault = false ORDER BY a.created_at DESC LIMIT 1")
    Optional<Address> findFirstByUserIdAndIsDefaultFalseOrderByCreatedAtDesc(Long userId);
}
