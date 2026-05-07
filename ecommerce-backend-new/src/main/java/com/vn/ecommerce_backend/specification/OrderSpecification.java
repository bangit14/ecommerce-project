package com.vn.ecommerce_backend.specification;

import com.vn.ecommerce_backend.dto.request.OrderFilter;
import com.vn.ecommerce_backend.entity.Order;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;

public class OrderSpecification {

    public static Specification<Order> withFilter(OrderFilter filter) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (filter.getOrderCode() != null && !filter.getOrderCode().trim().isEmpty()) {
                predicates.add(cb.like(cb.lower(root.get("orderCode")), "%" + filter.getOrderCode().toLowerCase() + "%"));
            }

            if (filter.getOrderStatus() != null) {
                predicates.add(cb.equal(root.get("status"), filter.getOrderStatus()));
            }

            if (filter.getPaymentStatus() != null) {
                predicates.add(cb.equal(root.get("paymentStatus"), filter.getPaymentStatus()));
            }

            if (filter.getOrderDateFrom() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("orderDate"), filter.getOrderDateFrom()));
            }

            if (filter.getOrderDateTo() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("orderDate"), filter.getOrderDateTo()));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
