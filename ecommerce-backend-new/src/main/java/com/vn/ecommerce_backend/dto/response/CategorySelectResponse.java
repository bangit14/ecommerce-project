package com.vn.ecommerce_backend.dto.response;

import lombok.Builder;

@Builder
public class CategorySelectResponse {
    private Long id;
    private String name;

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }
}
