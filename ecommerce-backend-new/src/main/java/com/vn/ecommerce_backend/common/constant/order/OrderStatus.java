package com.vn.ecommerce_backend.common.constant.order;

public enum OrderStatus {
    PENDING("Chờ xác nhận"),
    CONFIRMED("Đã xác nhận"),
    PROCESSING("Đang xử lý"),
    SHIPPED("Đã giao cho vận chuyển"),
    DELIVERED("Đã giao hàng thành công"),
    CANCELLED("Đã hủy"),
    RETURNED("Trả hàng/hoàn tiền");

    private final String description;

    OrderStatus(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
