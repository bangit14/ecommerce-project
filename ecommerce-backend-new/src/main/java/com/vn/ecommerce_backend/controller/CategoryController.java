package com.vn.ecommerce_backend.controller;

import com.vn.ecommerce_backend.common.util.PageableUtils;
import com.vn.ecommerce_backend.dto.request.CategoryCreateRequest;
import com.vn.ecommerce_backend.dto.request.CategoryFilter;
import com.vn.ecommerce_backend.dto.request.CategoryUpdateRequest;
import com.vn.ecommerce_backend.dto.response.*;
import com.vn.ecommerce_backend.service.CategoryService;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/categories")
public class CategoryController {

    private final CategoryService categoryService;

    public CategoryController(CategoryService categoryService) {
        this.categoryService = categoryService;
    }

    @GetMapping("/list")
    public ResponseEntity<PageResponse<CategoryResponse>> getAllCategories(
            @ModelAttribute CategoryFilter filter,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String sortBy,
            @RequestParam(required = false) String sortDir) {

        Pageable pageable = PageableUtils.createPageable(page, size, sortBy, sortDir);

        PageResponse<CategoryResponse> result = categoryService.getAllCategories(filter, pageable);

        return ResponseEntity.status(HttpStatus.OK).body(result);
    }

    @GetMapping("/{id}")
    public ResponseEntity<CategoryResponse> getCategoryById(@PathVariable Long id) {
        return ResponseEntity.ok(categoryService.getCategoryById(id));
    }

    @GetMapping("/{id}/subcategories")
    public ResponseEntity<List<CategoryResponse>> getSubcategories(@PathVariable Long id) {
        return ResponseEntity.ok(categoryService.getChildCategories(id));
    }

    @GetMapping("/parent-options")
    public ResponseEntity<List<CategorySelectResponse>> getParentOptions(@RequestParam(required = false) Long excludeCategoryId) {
        return ResponseEntity.ok(categoryService.getAvailableParents(excludeCategoryId));
    }

    @GetMapping("/{id}/tree")
    public ResponseEntity<List<CategoryTreeResponse>> getCategorySubtree(@PathVariable Long id) {
        return ResponseEntity.ok(categoryService.getCategoryTreeByParentId(id));
    }

    @GetMapping("/tree")
    public ResponseEntity<List<CategoryTreeResponse>> getRootCategoryTree() {
        return ResponseEntity.ok(categoryService.getCategoryTree());
    }

    @PostMapping("/create")
    public ResponseEntity<CategoryResponse> createCategory(@RequestBody CategoryCreateRequest request) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(categoryService.createCategory(request));
    }

    @PutMapping("/update/{id}")
    public ResponseEntity<Void> updateCategory(@PathVariable Long id, @RequestBody CategoryUpdateRequest request) {
        categoryService.updateCategory(id, request);

        return ResponseEntity
                .status(HttpStatus.ACCEPTED).build();
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<Void> deleteCategory(@PathVariable Long id) {
        categoryService.deleteCategory(id);
        return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
    }
}
