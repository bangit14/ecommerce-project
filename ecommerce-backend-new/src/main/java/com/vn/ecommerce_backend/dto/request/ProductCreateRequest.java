package com.vn.ecommerce_backend.dto.request;

import java.math.BigDecimal;
import java.util.List;

public class ProductCreateRequest {

    private String name;
    private String slug;
    private String description;
    private String brand;
    private BigDecimal weight;
    private boolean active;

    private List<Long> categoryIds;
    private Long primaryCategoryId;

    private List<ProductVariantCreateRequest> variants;

    private List<ProductImageUploadRequest> images;

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

    public Long getPrimaryCategoryId() {
        return primaryCategoryId;
    }

    public List<Long> getCategoryIds() {
        return categoryIds;
    }

    public List<ProductVariantCreateRequest> getVariants() {
        return variants;
    }

    public List<ProductImageUploadRequest> getImages() {
        return images;
    }
}
