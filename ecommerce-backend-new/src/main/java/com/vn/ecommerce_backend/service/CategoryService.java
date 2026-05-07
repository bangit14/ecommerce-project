package com.vn.ecommerce_backend.service;

import com.vn.ecommerce_backend.dto.request.CategoryCreateRequest;
import com.vn.ecommerce_backend.dto.request.CategoryFilter;
import com.vn.ecommerce_backend.dto.request.CategoryUpdateRequest;
import com.vn.ecommerce_backend.dto.response.CategoryResponse;
import com.vn.ecommerce_backend.dto.response.CategorySelectResponse;
import com.vn.ecommerce_backend.dto.response.CategoryTreeResponse;
import com.vn.ecommerce_backend.dto.response.PageResponse;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface CategoryService {

    // Admin Category Service

    PageResponse<CategoryResponse> getAllCategories(CategoryFilter filter, Pageable pageable);

    CategoryResponse createCategory(CategoryCreateRequest request);

    void updateCategory(Long id, CategoryUpdateRequest request);

    void deleteCategory(Long id);

    CategoryResponse getCategoryById(Long id);

    List<CategorySelectResponse> getAvailableParents(Long excludeCategoryId);

    // User Category Service

    List<CategoryResponse> getRootCategories();

    List<CategoryResponse> getChildCategories(Long parentId);

    List<CategoryTreeResponse> getCategoryTree();

    List<CategoryTreeResponse> getCategoryTreeByParentId(Long parentId);

    List<Long> getAllDescendantCategoryIds(Long categoryId);

}
