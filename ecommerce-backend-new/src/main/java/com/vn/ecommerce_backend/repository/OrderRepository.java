package com.vn.ecommerce_backend.repository;

import com.vn.ecommerce_backend.common.constant.order.OrderStatus;
import com.vn.ecommerce_backend.entity.Order;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface OrderRepository extends JpaRepository<Order, Long>, JpaSpecificationExecutor<Order> {

    Page<Order> findByUserId(Long userId, Pageable pageable);

    @Query("""
        SELECT o
        from Order o
        left join fetch o.items i
        where o.id = :orderId
        """)
    Optional<Order> findByOrderId(@Param("orderId") Long orderId);

    @Query("""
        SELECT o
        from Order o
        left join fetch o.items i
        where o.id = :id and o.user.id = :userId
        """)
    Optional<Order> findOrderWithItems(@Param("id") Long id,@Param("userId") Long userId);

    @Query("""
        SELECT o 
        FROM Order o 
        left join fetch o.items i
        WHERE o.user.id = :userId 
        """)
    Optional<Order> findOrderByUserId(@Param("userId") Long userId);
}
