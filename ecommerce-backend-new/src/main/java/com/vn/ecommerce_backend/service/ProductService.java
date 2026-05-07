package com.vn.ecommerce_backend.service;

import com.vn.ecommerce_backend.dto.request.ProductCreateRequest;
import com.vn.ecommerce_backend.dto.request.ProductFilter;
import com.vn.ecommerce_backend.dto.request.ProductUpdateRequest;
import com.vn.ecommerce_backend.dto.response.PageResponse;
import com.vn.ecommerce_backend.dto.response.ProductDetailResponse;
import com.vn.ecommerce_backend.dto.response.ProductResponse;
import org.springframework.data.domain.Pageable;

public interface ProductService {

    PageResponse<ProductResponse> getProducts(ProductFilter filter, Pageable pageable);

    ProductDetailResponse getProductById(Long id);

    ProductResponse createProduct(ProductCreateRequest request);

    void updateProduct(Long id, ProductUpdateRequest request);

    void deleteProduct(Long id);
}
