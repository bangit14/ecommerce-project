package com.vn.ecommerce_backend.repository;

import com.vn.ecommerce_backend.common.constant.transaction.TransactionType;
import com.vn.ecommerce_backend.entity.InventoryTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface InventoryTransactionRepository extends JpaRepository<InventoryTransaction, Long> {
    List<InventoryTransaction> findByOrderId(Long orderId);

    List<InventoryTransaction> findByVariantIdOrderByCreatedAtDesc(Long variantId);

    @Query("SELECT COALESCE(SUM(CASE WHEN t.type = 'IN' OR t.type = 'RETURN' THEN t.quantity ELSE -t.quantity END), 0) " +
            "FROM InventoryTransaction t WHERE t.variant.id = :variantId")
    Integer getCurrentStock(@Param("variantId") Long variantId);

    Optional<InventoryTransaction> findTopByVariantIdAndOrderIdAndTypeOrderByCreatedAtDesc(
            Long variantId, Long orderId, TransactionType type);
}
