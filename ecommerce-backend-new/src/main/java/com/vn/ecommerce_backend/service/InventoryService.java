package com.vn.ecommerce_backend.service;

import com.vn.ecommerce_backend.dto.response.InventoryTransactionResponse;

import java.util.List;

public interface InventoryService {
    boolean checkStock(Long variantId, Integer quantity);

    void reserveStock(Long variantId, Integer quantity);

    void confirmStockDeduction(Long orderId);

    void returnStock(Long orderId);

    void adjustStock(Long variantId, Integer quantity, String note, Long userId);

    Integer getCurrentStock(Long variantId);

    List<InventoryTransactionResponse> getTransactionHistory(Long variantId);
}
