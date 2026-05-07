package com.vn.ecommerce_backend.specification;

import com.vn.ecommerce_backend.dto.request.ProductFilter;
import com.vn.ecommerce_backend.entity.Product;
import com.vn.ecommerce_backend.entity.ProductCategory;
import com.vn.ecommerce_backend.entity.ProductVariant;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;

public class ProductSpecification {

    public static Specification<Product> withFilter(ProductFilter filter) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (filter.getName() != null && !filter.getName().trim().isEmpty()) {
                predicates.add(cb.like(cb.lower(root.get("name")), "%" + filter.getName().toLowerCase() + "%"));
            }

            if (filter.getSlug() != null && !filter.getSlug().trim().isEmpty()) {
                predicates.add(cb.like(cb.lower(root.get("slug")), "%" + filter.getSlug().toLowerCase() + "%"));
            }

            if (filter.getBrand() != null && !filter.getBrand().trim().isEmpty()) {
                predicates.add(cb.like(cb.lower(root.get("brand")), "%" + filter.getBrand().toLowerCase() + "%"));
            }

            if (filter.getCategoryId() != null) {
                Join<Product, ProductCategory> pcJoin = root.join("productCategories", JoinType.INNER);
                predicates.add(pcJoin.get("category").get("id").in(filter.getCategoryId()));
            }

            if (filter.getStatus() != null) {
                predicates.add(cb.equal(root.get("status"), filter.getStatus()));
            }

            if (filter.getBrand() != null && !filter.getBrand().trim().isEmpty()) {
                predicates.add(cb.equal(cb.lower(root.get("brand")), filter.getBrand().toLowerCase()));
            }

            if (filter.getMinPrice() != null || filter.getMaxPrice() != null) {
                Join<Product, ProductVariant> variantJoin = root.join("variants", JoinType.INNER);

                if (filter.getMinPrice() != null) {
                    predicates.add(cb.greaterThanOrEqualTo(variantJoin.get("price"), filter.getMinPrice()));
                }
                if (filter.getMaxPrice() != null) {
                    predicates.add(cb.lessThanOrEqualTo(variantJoin.get("price"), filter.getMaxPrice()));
                }
            }

            if (Boolean.TRUE.equals(filter.getHasStock())) {
                Join<Product, ProductVariant> variantJoin = root.join("variants", JoinType.INNER);
                predicates.add(cb.greaterThan(variantJoin.get("stockQuantity"), 0));
            }

            query.distinct(true);
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
