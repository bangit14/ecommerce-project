package com.vn.ecommerce_backend.dto.request;

import java.math.BigDecimal;
import java.util.List;

public class ProductUpdateRequest {

    private String name;
    private String slug;
    private String description;
    private String brand;
    private BigDecimal weight;
    private boolean active;

    private List<Long> categoryIds;
    private Long primaryCategoryId;

    private List<ProductVariantUpdateRequest> variants;

    public String getName() {
        return name;
    }

    public String getSlug() {
        return slug;
    }

    public String getDescription() {
        return description;
    }

    public String getBrand() {
        return brand;
    }

    public BigDecimal getWeight() {
        return weight;
    }

    public boolean isActive() {
        return active;
    }

    public List<Long> getCategoryIds() {
        return categoryIds;
    }

    public Long getPrimaryCategoryId() {
        return primaryCategoryId;
    }

    public List<ProductVariantUpdateRequest> getVariants() {
        return variants;
    }
}
