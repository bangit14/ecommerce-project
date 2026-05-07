package com.vn.ecommerce_backend.repository;

import com.vn.ecommerce_backend.entity.Category;
import com.vn.ecommerce_backend.entity.ProductCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface ProductCategoryRepository extends JpaRepository<ProductCategory, Long> {
    List<ProductCategory> findByProductId(Long productId);
    Optional<ProductCategory> findByProductIdAndCategoryId(Long productId, Long categoryId);
    void deleteByProductId(Long productId);

    @Query("""
    SELECT pc.category 
    FROM ProductCategory pc
    WHERE pc.product.id = :productId 
      AND pc.isPrimary = true
    """)
    Optional<Category> findPrimaryCategoryByProductId(Long productId);
}
