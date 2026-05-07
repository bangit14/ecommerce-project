package com.vn.ecommerce_backend.repository;

import com.vn.ecommerce_backend.entity.ProductImage;
import com.vn.ecommerce_backend.entity.ProductVariant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ProductVariantRepository extends JpaRepository<ProductVariant, Long> {

    List<ProductVariant> findByProductIdOrderByIsDefaultDesc(Long productId);

    Optional<ProductVariant> findBySku(String sku);

    @Query("""
        select pv from ProductVariant pv
        left join fetch pv.product p
        where pv.id = :id
        """)
    Optional<ProductVariant> findByIdWithProduct(@Param("id") Long id);

    @Query("SELECT v FROM ProductVariant v " +
            "left join fetch v.product " +
            "WHERE v.id = :variantId")
    Optional<ProductVariant> findByVariantId(@Param("variantId") Long variantId);

    @Modifying
    @Query("UPDATE ProductVariant v SET v.isDefault = false WHERE v.product.id = :productId")
    void resetDefaultVariant(@Param("productId") Long productId);

    void deleteByProductId(Long productId);
}
