package com.vn.ecommerce_backend.service.impl;

import com.vn.ecommerce_backend.dto.response.CategoryResponse;
import com.vn.ecommerce_backend.entity.Category;
import com.vn.ecommerce_backend.entity.Product;
import com.vn.ecommerce_backend.entity.ProductCategory;
import com.vn.ecommerce_backend.exception.AppException;
import com.vn.ecommerce_backend.exception.ErrorCode;
import com.vn.ecommerce_backend.repository.CategoryRepository;
import com.vn.ecommerce_backend.repository.ProductCategoryRepository;
import com.vn.ecommerce_backend.repository.ProductRepository;
import com.vn.ecommerce_backend.service.ProductCategoryService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@Slf4j(topic = "Product-Category-Service")
public class ProductCategoryServiceImpl implements ProductCategoryService {

    private final ProductCategoryRepository productCategoryRepository;
    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;


    public ProductCategoryServiceImpl(ProductCategoryRepository productCategoryRepository, ProductRepository productRepository, CategoryRepository categoryRepository) {
        this.productCategoryRepository = productCategoryRepository;
        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
    }

    @Override
    public void assignCategoriesToProduct(Long productId, List<Long> categoryIds, Long primaryCategoryId) {

        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_FOUND));

        productCategoryRepository.deleteByProductId(productId);

        if (categoryIds == null && categoryIds.isEmpty()) {
            return;
        }

        for (Long categoryId : categoryIds) {
            Category category = categoryRepository.findById(categoryId)
                    .orElseThrow(() -> new AppException(ErrorCode.CATEGORY_NOT_FOUND));

            boolean isPrimary = categoryId.equals(primaryCategoryId);

            ProductCategory productCategory = new ProductCategory();
            productCategory.setProduct(product);
            productCategory.setCategory(category);
            productCategory.setPrimary(isPrimary);
            productCategory.setCreatedAt(LocalDateTime.now());
            productCategoryRepository.save(productCategory);

            if (isPrimary) product.setPrimaryCategory(category);
        }

        productRepository.save(product);
        log.debug("Assigned categories {} to product {}", categoryIds, productId);

    }

    @Override
    public void removeAllCategoriesFromProduct(Long productId) {
        productCategoryRepository.deleteByProductId(productId);
    }

    @Override
    public List<CategoryResponse> getCategoriesByProductId(Long productId) {

        List<ProductCategory> productCategories = productCategoryRepository.findByProductId(productId);

        return productCategories.stream()
                .map(
                        pc -> CategoryResponse.builder()
                                .id(pc.getCategory().getId())
                                .name(pc.getCategory().getName())
                                .slug(pc.getCategory().getSlug())
                                .description(pc.getCategory().getDescription())
                                .path(pc.getCategory().getPath())
                                .iconUrl(pc.getCategory().getIconUrl())
                                .imageUrl(pc.getCategory().getImageUrl())
                                .createdAt(pc.getCategory().getCreatedAt())
                                .updatedAt(pc.getCategory().getUpdatedAt())
                                .build()
                ).toList();
    }
}
