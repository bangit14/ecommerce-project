package com.vn.ecommerce_backend.messaging.event;

import com.vn.ecommerce_backend.common.constant.order.OrderStatus;
import lombok.Builder;

@Builder
public class OrderStatusUpdatedEvent {
    private Long orderId;
    private OrderStatus status;
    private String note;
    private Long updatedBy;

    public Long getOrderId() {
        return orderId;
    }

    public void setOrderId(Long orderId) {
        this.orderId = orderId;
    }

    public OrderStatus getStatus() {
        return status;
    }

    public void setStatus(OrderStatus status) {
        this.status = status;
    }

    public Long getUpdatedBy() {
        return updatedBy;
    }

    public void setUpdatedBy(Long updatedBy) {
        this.updatedBy = updatedBy;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }
}
