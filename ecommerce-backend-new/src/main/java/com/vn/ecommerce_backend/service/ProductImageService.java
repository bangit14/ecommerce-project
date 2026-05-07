package com.vn.ecommerce_backend.service;

import com.vn.ecommerce_backend.dto.request.ProductImageUploadRequest;
import com.vn.ecommerce_backend.dto.response.ProductImageResponse;

import java.util.List;

public interface ProductImageService {

    List<ProductImageResponse> getImagesByProductId(Long productId);

    void uploadImage(Long productId, ProductImageUploadRequest request);

    void deleteAllImagesByProductId(Long productId);

    void deleteImage(Long imageId);
}
