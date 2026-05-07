package com.vn.ecommerce_backend.dto.request;

public class CategoryFilter {
    private String name;
    private String slug;
    private Long parentId;
    private String path;
    private Long level;

    public String getName() {
        return name;
    }

    public String getSlug() {
        return slug;
    }

    public Long getParentId() {
        return parentId;
    }

    public String getPath() {
        return path;
    }

    public Long getLevel() {
        return level;
    }

    public void setName(String name) {
        this.name = name;
    }

    public void setSlug(String slug) {
        this.slug = slug;
    }

    public void setParentId(Long parentId) {
        this.parentId = parentId;
    }

    public void setPath(String path) {
        this.path = path;
    }

    public void setLevel(Long level) {
        this.level = level;
    }
}
