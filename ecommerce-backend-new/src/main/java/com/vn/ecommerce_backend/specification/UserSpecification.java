package com.vn.ecommerce_backend.specification;

import com.vn.ecommerce_backend.dto.request.UserFilter;
import com.vn.ecommerce_backend.entity.Role;
import com.vn.ecommerce_backend.entity.User;
import com.vn.ecommerce_backend.entity.UserHasRole;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;

public class UserSpecification {

    public static Specification<User> withFilter(UserFilter filter) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (StringUtils.hasText(filter.getUsername())) {
                predicates.add(cb.like(cb.lower(root.get("username")), "%" + filter.getUsername().toLowerCase() + "%"));
            }

            if (StringUtils.hasText(filter.getEmail())) {
                predicates.add(cb.like(cb.lower(root.get("email")), "%" + filter.getEmail().toLowerCase() + "%"));
            }

            if (filter.getActive() != null) {
                predicates.add(cb.equal(root.get("active"), filter.getActive()));
            }

            if (StringUtils.hasText(filter.getRoleName())) {
                Join<User, UserHasRole> userRoleJoin = root.join("userHasRoles", JoinType.LEFT);
                Join<UserHasRole, Role> roleJoin = userRoleJoin.join("role", JoinType.LEFT);
                predicates.add(cb.equal(cb.lower(roleJoin.get("name")), filter.getRoleName().toLowerCase()));
            }

            if (filter.getCreatedFrom() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), filter.getCreatedFrom().atStartOfDay()));
            }
            if (filter.getCreatedTo() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"), filter.getCreatedTo().atTime(23,59,59)));
            }

            query.distinct(true);

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
