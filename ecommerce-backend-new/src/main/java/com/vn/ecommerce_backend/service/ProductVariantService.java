package com.vn.ecommerce_backend.service;

import com.vn.ecommerce_backend.dto.request.ProductVariantCreateRequest;
import com.vn.ecommerce_backend.dto.request.ProductVariantUpdateRequest;
import com.vn.ecommerce_backend.dto.response.ProductVariantResponse;

import java.util.List;

public interface ProductVariantService {

    List<ProductVariantResponse> getVariantsByProductId(Long productId);

    ProductVariantResponse createVariant(Long productId, ProductVariantCreateRequest request);

    void updateVariant(Long variantId, ProductVariantUpdateRequest request);

    void deleteVariant(Long variantId);

    void deleteVariantsByProductId(Long productId);
}
