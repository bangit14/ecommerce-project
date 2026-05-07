package com.vn.ecommerce_backend.common.util;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.util.StringUtils;

public class PageableUtils {

    private static final int DEFAULT_PAGE = 0;
    private static final int DEFAULT_SIZE = 10;
    private static final int MAX_SIZE = 100;           // tùy dự án, thường 50-200
    private static final Sort DEFAULT_SORT = Sort.by(Sort.Direction.DESC, "createdAt");

    public static Pageable createPageable(Integer page, Integer size, String sortBy, String sortDir) {
        int effectivePage = (page != null && page >= 0) ? page : DEFAULT_PAGE;
        int effectiveSize = calculateEffectiveSize(size);

        Sort sort = resolveSort(sortBy, sortDir);

        return PageRequest.of(effectivePage, effectiveSize, sort);
    }

    private static int calculateEffectiveSize(Integer size) {
        if (size == null || size <= 0) {
            return DEFAULT_SIZE;
        }
        return Math.min(size, MAX_SIZE);
    }

    private static Sort resolveSort(String sortBy, String sortDir) {
        if (!StringUtils.hasText(sortBy)) {
            return DEFAULT_SORT;
        }

        Sort.Direction direction = Sort.Direction.fromOptionalString(sortDir)
                .orElse(Sort.Direction.DESC);

        return Sort.by(direction, sortBy);
    }

}
