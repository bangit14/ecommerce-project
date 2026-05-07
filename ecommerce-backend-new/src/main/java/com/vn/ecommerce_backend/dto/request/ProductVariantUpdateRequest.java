package com.vn.ecommerce_backend.dto.request;


import com.fasterxml.jackson.databind.JsonNode;

import java.math.BigDecimal;

public class ProductVariantUpdateRequest {

    private Long id;
    private String sku;
    private BigDecimal price;
    private BigDecimal compareAtPrice;
    private Integer stockQuantity;
    private BigDecimal weight;
    private JsonNode attributes;
    private boolean isDefault;

    public Long getId() {
        return id;
    }

    public String getSku() {
        return sku;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public BigDecimal getCompareAtPrice() {
        return compareAtPrice;
    }

    public Integer getStockQuantity() {
        return stockQuantity;
    }

    public BigDecimal getWeight() {
        return weight;
    }

    public JsonNode getAttributes() {
        return attributes;
    }

    public boolean isDefault() {
        return isDefault;
    }

    public void setSku(String sku) {
        this.sku = sku;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }

    public void setCompareAtPrice(BigDecimal compareAtPrice) {
        this.compareAtPrice = compareAtPrice;
    }

    public void setStockQuantity(Integer stockQuantity) {
        this.stockQuantity = stockQuantity;
    }

    public void setWeight(BigDecimal weight) {
        this.weight = weight;
    }

    public void setAttributes(JsonNode attributes) {
        this.attributes = attributes;
    }

    public void setDefault(boolean aDefault) {
        isDefault = aDefault;
    }

    public void setId(Long id) {
        this.id = id;
    }
}
