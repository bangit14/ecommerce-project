package com.vn.ecommerce_backend.repository;

import com.vn.ecommerce_backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long>, JpaSpecificationExecutor<User> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    boolean existsByUsername(String username);

    @Query("""
        SELECT u 
        FROM User u 
        LEFT JOIN FETCH u.roles ur 
        LEFT JOIN FETCH ur.role r 
        LEFT JOIN FETCH r.permissions 
        WHERE u.id = :id """)
    Optional<User> findUserWithRolesAndPermissions(@Param("id") Long id);

    @Query("""
        SELECT u 
        FROM User u 
        LEFT JOIN FETCH u.roles ur 
        LEFT JOIN FETCH ur.role r 
        LEFT JOIN FETCH r.permissions 
        WHERE u.username = :username """)
    Optional<User> findUserWithRolesAndPermissionsByUsername(@Param("username") String username);
}
