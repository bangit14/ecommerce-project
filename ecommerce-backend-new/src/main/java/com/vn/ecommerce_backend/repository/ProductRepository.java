package com.vn.ecommerce_backend.repository;

import com.vn.ecommerce_backend.entity.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface ProductRepository extends JpaRepository<Product, Long>, JpaSpecificationExecutor<Product> {

    Optional<Product> findBySlug(String slug);

    // Query lấy sản phẩm theo category và tất cả subcategory (rất hay dùng)
    @Query("""
        SELECT DISTINCT p FROM Product p 
        JOIN p.productCategories pc 
        WHERE pc.category.id IN (
            SELECT c.id FROM Category c 
            WHERE c.path LIKE :pathPattern ESCAPE '\\'
        )
        """)
    Page<Product> findByCategoryPath(@Param("pathPattern") String pathPattern, Pageable pageable);
}
