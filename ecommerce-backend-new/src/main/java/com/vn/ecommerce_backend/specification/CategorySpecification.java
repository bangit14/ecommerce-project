package com.vn.ecommerce_backend.specification;

import com.vn.ecommerce_backend.dto.request.CategoryFilter;
import com.vn.ecommerce_backend.entity.Category;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;

public class CategorySpecification {

    public static Specification<Category> withFilter(CategoryFilter filter) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (filter.getName() != null && !filter.getName().isEmpty()) {
                predicates.add(cb.like(cb.lower(root.get("name")), "%" + filter.getName().toLowerCase() + "%"));
            }
            if (filter.getSlug() != null && !filter.getSlug().isEmpty()) {
                predicates.add(cb.like(cb.lower(root.get("slug")), "%" + filter.getSlug().toLowerCase() + "%"));
            }
            if (filter.getParentId() != null) {
                predicates.add(cb.equal(root.get("parent").get("id"), filter.getParentId()));
            }
            if (filter.getPath() != null && !filter.getPath().isEmpty()) {
                predicates.add(cb.like(root.get("path"), "%" + filter.getPath() + "%"));
            }
            if (filter.getLevel() != null) {
                predicates.add(cb.equal(root.get("level"), filter.getLevel()));
            }

            query.distinct(true);

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
