package com.vn.ecommerce_backend.repository;

import com.vn.ecommerce_backend.entity.ProductImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface ProductImageRepository extends JpaRepository<ProductImage, Long> {

    List<ProductImage> findByProductIdOrderBySortOrderAsc(Long productId);

    List<ProductImage> findByVariantIdOrderBySortOrderAsc(Long variantId);

    List<ProductImage> findByProductId(Long productId);

    void deleteByProductId(Long productId);

    @Modifying
    @Query("UPDATE ProductImage pi SET pi.isMain = false WHERE pi.product.id = :productId")
    void updateIsMainToFalse(Long productId);

    Integer getMaxSortOrderByProductId(Long productId);
}
