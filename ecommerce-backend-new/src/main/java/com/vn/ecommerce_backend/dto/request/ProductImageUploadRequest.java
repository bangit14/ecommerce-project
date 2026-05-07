package com.vn.ecommerce_backend.dto.request;

import org.springframework.web.multipart.MultipartFile;

public class ProductImageUploadRequest {

    private MultipartFile file;

    private Long variantId;

    private boolean isMain = false;

    private Integer sortOrder = 0;

    public MultipartFile getFile() {
        return file;
    }

    public Long getVariantId() {
        return variantId;
    }

    public boolean isMain() {
        return isMain;
    }

    public Integer getSortOrder() {
        return sortOrder;
    }
}
