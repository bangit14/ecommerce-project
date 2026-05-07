package com.vn.ecommerce_backend.service.impl;

import com.vn.ecommerce_backend.common.constant.transaction.TransactionType;
import com.vn.ecommerce_backend.dto.response.InventoryTransactionResponse;
import com.vn.ecommerce_backend.entity.InventoryTransaction;
import com.vn.ecommerce_backend.entity.Order;
import com.vn.ecommerce_backend.entity.OrderItem;
import com.vn.ecommerce_backend.entity.ProductVariant;
import com.vn.ecommerce_backend.exception.AppException;
import com.vn.ecommerce_backend.exception.ErrorCode;
import com.vn.ecommerce_backend.repository.InventoryTransactionRepository;
import com.vn.ecommerce_backend.repository.OrderRepository;
import com.vn.ecommerce_backend.repository.ProductVariantRepository;
import com.vn.ecommerce_backend.service.InventoryService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Slf4j(topic = "Inventory-Service")
public class InventoryServiceImpl implements InventoryService {

    private final InventoryTransactionRepository inventoryTransactionRepository;
    private final ProductVariantRepository productVariantRepository;
    private final OrderRepository orderRepository;

    public InventoryServiceImpl(InventoryTransactionRepository inventoryTransactionRepository, ProductVariantRepository productVariantRepository, OrderRepository orderRepository) {
        this.inventoryTransactionRepository = inventoryTransactionRepository;
        this.productVariantRepository = productVariantRepository;
        this.orderRepository = orderRepository;
    }

    @Override
    public boolean checkStock(Long variantId, Integer quantity) {
        Integer currentStock = getCurrentStock(variantId);
        return currentStock >= quantity;
    }

    @Override
    @Transactional(rollbackFor = AppException.class)
    public void reserveStock(Long variantId, Integer quantity) {
        ProductVariant variant = productVariantRepository.findById(variantId)
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_VARIANT_NOT_FOUND));

        if (!variant.hasEnoughStock(quantity)) {
            throw new AppException(ErrorCode.INSUFFICIENT_STOCK);
        }

        variant.reduceStock(quantity);
        productVariantRepository.save(variant);

        InventoryTransaction transaction = new InventoryTransaction();
        transaction.setVariant(variant);
        transaction.setType(TransactionType.RESERVE);
        transaction.setQuantity(quantity);
        transaction.setNote("Reserve stock for variant " + variantId);
        transaction.setCreatedBy(0L);

        inventoryTransactionRepository.save(transaction);
        log.debug("Reserved {} units of variant {}. Current stock: {}", quantity, variantId, getCurrentStock(variantId));
    }

    @Override
    @Transactional
    public void confirmStockDeduction(Long orderId) {
        List<OrderItem> orderItems = getOrderItems(orderId);

        for (OrderItem orderItem : orderItems) {
            ProductVariant variant = orderItem.getVariant();

            variant.reduceStock(orderItem.getQuantity());

            productVariantRepository.save(variant);

            InventoryTransaction transaction = new InventoryTransaction();
            transaction.setVariant(variant);
            transaction.setOrder(orderItem.getOrder());
            transaction.setType(TransactionType.OUT);
            transaction.setQuantity(orderItem.getQuantity());
            transaction.setNote("Xuất kho cho đơn hàng #" + orderId);
            transaction.setCreatedBy(0L);

            inventoryTransactionRepository.save(transaction);
        }

        log.debug("Confirmed stock deduction for order {}", orderId);
    }

    @Override
    @Transactional
    public void returnStock(Long orderId) {
        List<OrderItem> orderItems = getOrderItems(orderId);

        for (OrderItem orderItem : orderItems) {
            ProductVariant variant = orderItem.getVariant();

            variant.increaseStock(orderItem.getQuantity());
            productVariantRepository.save(variant);

            InventoryTransaction transaction = new InventoryTransaction();
            transaction.setVariant(variant);
            transaction.setOrder(orderItem.getOrder());
            transaction.setType(TransactionType.RETURN);
            transaction.setQuantity(orderItem.getQuantity());
            transaction.setNote("Trả hàng cho đơn hàng #" + orderId);
            transaction.setCreatedBy(0L);

            inventoryTransactionRepository.save(transaction);
        }

        log.debug("Returned stock for order {}", orderId);
    }

    @Override
    @Transactional
    public void adjustStock(Long variantId, Integer quantity, String note, Long userId) {
        ProductVariant variant = productVariantRepository.findById(variantId)
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_VARIANT_NOT_FOUND));

        Integer oldStock = getCurrentStock(variantId);
        Integer newStock;

        if (quantity >= 0) {
            variant.increaseStock(quantity);
            newStock = oldStock + quantity;
        } else {
            int absQuantity = Math.abs(quantity);
            if (!variant.hasEnoughStock(absQuantity)) {
                throw new AppException(ErrorCode.INSUFFICIENT_STOCK);
            }
            variant.reduceStock(absQuantity);
            newStock = variant.getStockQuantity();
        }

        productVariantRepository.save(variant);

        TransactionType transactionType = quantity >= 0 ? TransactionType.IN : TransactionType.OUT;

        InventoryTransaction transaction = new InventoryTransaction();
        transaction.setVariant(variant);
        transaction.setType(transactionType);
        transaction.setQuantity(Math.abs(quantity));
        transaction.setNote(note != null ? note : "Adjust stock by user " + userId);
        transaction.setCreatedBy(userId);

        inventoryTransactionRepository.save(transaction);
        log.debug("Adjusted stock for variant {} by {} units. Old stock: {}, New stock: {}", variantId, quantity, oldStock, newStock);
    }

    @Override
    public Integer getCurrentStock(Long variantId) {
        return inventoryTransactionRepository.getCurrentStock(variantId);
    }

    @Override
    public List<InventoryTransactionResponse> getTransactionHistory(Long variantId) {

        List<InventoryTransaction> transactions = inventoryTransactionRepository.findByVariantIdOrderByCreatedAtDesc(variantId);

        return transactions.stream().map(
                transaction -> InventoryTransactionResponse.builder()
                        .id(transaction.getId())
                        .productVariant(transaction.getVariant())
                        .orderId(transaction.getOrder().getId())
                        .transactionType(transaction.getType())
                        .quantity(transaction.getQuantity())
                        .note(transaction.getNote())
                        .createdAt(transaction.getCreatedAt())
                        .createdBy(transaction.getCreatedBy())
                        .build()
        ).toList();
    }

    private List<OrderItem> getOrderItems(Long orderId) {
        Order order = orderRepository.findByOrderId(orderId)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));
        return order.getItems();
    }
}
