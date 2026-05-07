package com.vn.ecommerce_backend.repository;

import com.vn.ecommerce_backend.entity.UserHasRole;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface UserHasRoleRepository extends JpaRepository<UserHasRole, Long> {

    List<UserHasRole> findByUserId(Long userId);
}
