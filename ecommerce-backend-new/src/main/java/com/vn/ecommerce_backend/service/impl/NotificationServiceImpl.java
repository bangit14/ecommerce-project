package com.vn.ecommerce_backend.service.impl;

import com.vn.ecommerce_backend.common.constant.notification.NotificationType;
import com.vn.ecommerce_backend.dto.response.NotificationResponse;
import com.vn.ecommerce_backend.dto.response.PageResponse;
import com.vn.ecommerce_backend.messaging.producer.KafkaProducerService;
import com.vn.ecommerce_backend.repository.NotificationRepository;
import com.vn.ecommerce_backend.repository.UserRepository;
import com.vn.ecommerce_backend.service.NotificationService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

@Service
@Slf4j(topic = "NotificationService")
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final KafkaProducerService kafkaProducerService;

    public NotificationServiceImpl(NotificationRepository notificationRepository, UserRepository userRepository, KafkaProducerService kafkaProducerService) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
        this.kafkaProducerService = kafkaProducerService;
    }


    @Override
    public void sendOrderNotification(Long userId, String orderCode, String status) {

    }

    @Override
    public void sendPaymentNotification(Long userId, String orderCode, String paymentStatus) {

    }

    @Override
    public void createNotification(Long userId, String title, String body, NotificationType type, String imageUrl, String actionUrl) {

    }

    @Override
    public PageResponse<NotificationResponse> getMyNotifications(Long userId, Pageable pageable) {
        return null;
    }

    @Override
    public long getUnreadCount(Long userId) {
        return 0;
    }

    @Override
    public void markAsRead(Long notificationId, Long userId) {

    }

    @Override
    public void markAllAsRead(Long userId) {

    }
}
