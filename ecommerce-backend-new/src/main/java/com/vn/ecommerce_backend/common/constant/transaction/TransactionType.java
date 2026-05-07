package com.vn.ecommerce_backend.common.constant.transaction;

public enum TransactionType {
    IN,          // Nhập kho
    OUT,         // Xuất kho (bán hàng)
    ADJUST,      // Điều chỉnh
    RETURN,      // Hoàn kho
    RESERVE       // Hoàn tác giao dịch
}
