package com.vn.ecommerce_backend.messaging.consumer;

import com.vn.ecommerce_backend.messaging.event.OrderCancelledEvent;
import com.vn.ecommerce_backend.messaging.event.OrderCreatedEvent;
import com.vn.ecommerce_backend.messaging.event.OrderStatusUpdatedEvent;
import com.vn.ecommerce_backend.service.EmailService;
import com.vn.ecommerce_backend.service.InventoryService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

@Service
@Slf4j(topic = "OrderEventConsumer")
public class OrderEventConsumer {

    private final InventoryService inventoryService;
    private final EmailService emailService;

    public OrderEventConsumer(InventoryService inventoryService, EmailService emailService) {
        this.inventoryService = inventoryService;
        this.emailService = emailService;
    }

    @KafkaListener(topics = "order-created", groupId = "ecommerce-order-group")
    public void handleOrderCreated(OrderCreatedEvent event) {
        try {
            log.debug("Order created for user {}", event.getUserId());

            inventoryService.confirmStockDeduction(event.getOrderId());

            // Gửi email xác nhận (nếu cần)
            // emailService.sendOrderConfirmation(event.getUserId(), event.getOrderId());

        } catch (Exception e) {
            log.error("Error processing order-created event for orderId {}: {}", event.getOrderId(), e.getMessage());
            // TODO: Push vào Dead Letter Queue
        }
    }

    @KafkaListener(topics = "order-cancelled", groupId = "ecommerce-inventory-group")
    public void handleOrderCancelled(OrderCancelledEvent event) {
        try {
            log.info("Nhận event OrderCancelled: {}", event.getOrderId());
            inventoryService.returnStock(event.getOrderId());
        } catch (Exception e) {
            log.error("Lỗi xử lý order-cancelled event", e);
        }
    }

    @KafkaListener(topics = "order-status-updated", groupId = "ecommerce-inventory-group")
    public void handleOrderStatusUpdated(OrderStatusUpdatedEvent event) {
        log.info("Order status updated: {} -> {}", event.getOrderId(), event.getStatus());
        // Có thể xử lý thêm logic nếu cần
    }
}
