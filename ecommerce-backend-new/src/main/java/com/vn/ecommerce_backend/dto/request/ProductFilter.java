package com.vn.ecommerce_backend.dto.request;

import java.math.BigDecimal;
import java.util.List;

public class ProductFilter {

    private String name;
    private String slug;
    private List<Long> categoryId;
    private String status;
    private String brand;

    private BigDecimal minPrice;
    private BigDecimal maxPrice;

    private Boolean hasStock;
    private Boolean isFeatured;

    private String sortBy;
    private String sortDir = "asc";

    public String getName() {
        return name;
    }

    public String getSlug() {
        return slug;
    }

    public List<Long> getCategoryId() {
        return categoryId;
    }

    public String getStatus() {
        return status;
    }

    public String getBrand() {
        return brand;
    }

    public BigDecimal getMinPrice() {
        return minPrice;
    }

    public BigDecimal getMaxPrice() {
        return maxPrice;
    }

    public Boolean getHasStock() {
        return hasStock;
    }

    public Boolean getFeatured() {
        return isFeatured;
    }

    public String getSortBy() {
        return sortBy;
    }

    public String getSortDir() {
        return sortDir;
    }

    public void setName(String name) {
        this.name = name;
    }

    public void setSlug(String slug) {
        this.slug = slug;
    }

    public void setCategoryId(List<Long> categoryId) {
        this.categoryId = categoryId;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public void setBrand(String brand) {
        this.brand = brand;
    }

    public void setMinPrice(BigDecimal minPrice) {
        this.minPrice = minPrice;
    }

    public void setMaxPrice(BigDecimal maxPrice) {
        this.maxPrice = maxPrice;
    }

    public void setHasStock(Boolean hasStock) {
        this.hasStock = hasStock;
    }

    public void setFeatured(Boolean featured) {
        isFeatured = featured;
    }

    public void setSortBy(String sortBy) {
        this.sortBy = sortBy;
    }

    public void setSortDir(String sortDir) {
        this.sortDir = sortDir;
    }
}
