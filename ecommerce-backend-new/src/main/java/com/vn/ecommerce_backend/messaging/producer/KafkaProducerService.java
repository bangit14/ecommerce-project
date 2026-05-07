package com.vn.ecommerce_backend.messaging.producer;

import com.vn.ecommerce_backend.common.constant.order.OrderStatus;
import com.vn.ecommerce_backend.entity.Order;
import com.vn.ecommerce_backend.messaging.event.OrderCancelledEvent;
import com.vn.ecommerce_backend.messaging.event.OrderCreatedEvent;
import com.vn.ecommerce_backend.messaging.event.OrderStatusUpdatedEvent;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@Slf4j(topic = "KafkaProducerService")
public class KafkaProducerService {

    private final KafkaTemplate<String, Object> kafkaTemplate;

    public KafkaProducerService(KafkaTemplate<String, Object> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
    }

    public void sendOrderCreated(Order order) {
        OrderCreatedEvent event = OrderCreatedEvent.builder()
                .orderId(order.getId())
                .orderCode(order.getOrderCode())
                .userId(order.getUser().getId())
                .finalAmount(order.getFinalAmount())
                .createdAt(LocalDateTime.now())
                .build();

        kafkaTemplate.send("order-created", order.getOrderCode(), event);
    }

    public void sendOrderCancelled(Long orderId, String reason) {
        OrderCancelledEvent event = OrderCancelledEvent.builder()
                .orderId(orderId)
                .reason(reason)
                .build();
        kafkaTemplate.send("order-cancelled", event);
    }

    public void sendOrderStatusUpdated(Long orderId, OrderStatus status, String note) {
        OrderStatusUpdatedEvent event = OrderStatusUpdatedEvent.builder()
                .orderId(orderId)
                .status(status)
                .note(note)
                .build();
        kafkaTemplate.send("order-status-updated", event);
    }
}
