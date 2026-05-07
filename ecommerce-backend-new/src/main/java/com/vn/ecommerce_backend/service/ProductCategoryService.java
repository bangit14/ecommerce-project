package com.vn.ecommerce_backend.service;

import com.vn.ecommerce_backend.dto.response.CategoryResponse;

import java.util.List;

public interface ProductCategoryService {

    void assignCategoriesToProduct(Long productId, List<Long> categoryIds, Long primaryCategoryId);

    void removeAllCategoriesFromProduct(Long productId);

    List<CategoryResponse> getCategoriesByProductId(Long productId);
}
