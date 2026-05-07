package com.vn.ecommerce_backend.service;

import com.vn.ecommerce_backend.dto.request.CreateOrderRequest;
import com.vn.ecommerce_backend.dto.request.OrderFilter;
import com.vn.ecommerce_backend.dto.response.OrderResponse;
import com.vn.ecommerce_backend.dto.response.PageResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface OrderService {

    PageResponse<OrderResponse> getMyOrders(Long userId, Pageable pageable);

    OrderResponse getMyOrderDetails(Long userId, Long orderId);

    OrderResponse createOrder(Long userId, CreateOrderRequest request);

    void cancelOrder(Long userId, Long orderId, String reason);

    PageResponse<OrderResponse> getAllOrders(OrderFilter filter, Pageable pageable);

    OrderResponse getOrderDetails(Long orderId);

    void updateOrderStatus(Long orderId, String status);
}
