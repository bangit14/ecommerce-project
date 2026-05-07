package com.vn.ecommerce_backend.repository;

import com.vn.ecommerce_backend.entity.OrderHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface OrderHistoryRepository extends JpaRepository<OrderHistory, Long> {

    @Query("""
        select h from OrderHistory h
        where h.order.id = :orderId
        order by h.createdAt desc
    """)
    List<OrderHistory> findByOrderId(Long orderId);
}
