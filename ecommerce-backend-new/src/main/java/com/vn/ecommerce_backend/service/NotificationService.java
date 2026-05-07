package com.vn.ecommerce_backend.service;

import com.vn.ecommerce_backend.common.constant.notification.NotificationType;
import com.vn.ecommerce_backend.dto.response.NotificationResponse;
import com.vn.ecommerce_backend.dto.response.PageResponse;
import org.springframework.data.domain.Pageable;

public interface NotificationService {

    void sendOrderNotification(Long userId, String orderCode, String status);

    void sendPaymentNotification(Long userId, String orderCode, String paymentStatus);

    void createNotification(Long userId, String title, String body,
                            NotificationType type, String imageUrl, String actionUrl);

    PageResponse<NotificationResponse> getMyNotifications(Long userId, Pageable pageable);

    long getUnreadCount(Long userId);

    void markAsRead(Long notificationId, Long userId);

    void markAllAsRead(Long userId);
}
