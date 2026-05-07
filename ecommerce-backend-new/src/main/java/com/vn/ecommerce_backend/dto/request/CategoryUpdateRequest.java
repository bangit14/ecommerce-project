package com.vn.ecommerce_backend.dto.request;

public class CategoryUpdateRequest {
    private String name;
    private String slug;
    private Long parentId;
    private String description;
    private String imageUrl;
    private String iconUrl;
    private boolean isActive;
    private Integer sortOrder;

    public String getName() {
        return name;
    }

    public String getSlug() {
        return slug;
    }

    public Long getParentId() {
        return parentId;
    }

    public String getDescription() {
        return description;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public String getIconUrl() {
        return iconUrl;
    }

    public boolean isActive() {
        return isActive;
    }

    public Integer getSortOrder() {
        return sortOrder;
    }
}
