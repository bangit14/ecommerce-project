package com.vn.ecommerce_backend.service.impl;

import com.vn.ecommerce_backend.dto.request.*;
import com.vn.ecommerce_backend.dto.response.*;
import com.vn.ecommerce_backend.entity.Category;
import com.vn.ecommerce_backend.entity.Product;
import com.vn.ecommerce_backend.entity.ProductCategory;
import com.vn.ecommerce_backend.exception.AppException;
import com.vn.ecommerce_backend.exception.ErrorCode;
import com.vn.ecommerce_backend.repository.ProductCategoryRepository;
import com.vn.ecommerce_backend.repository.ProductRepository;
import com.vn.ecommerce_backend.service.ProductCategoryService;
import com.vn.ecommerce_backend.service.ProductImageService;
import com.vn.ecommerce_backend.service.ProductService;
import com.vn.ecommerce_backend.service.ProductVariantService;
import com.vn.ecommerce_backend.specification.ProductSpecification;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

import static io.lettuce.core.KillArgs.Builder.id;

@Service
@Slf4j(topic = "Product-Service")
public class ProductServiceImpl implements ProductService {

    private final ProductRepository productRepository;
    private final ProductCategoryRepository productCategoryRepository;
    private final ProductVariantService productVariantService;
    private final ProductImageService productImageService;
    private final ProductCategoryService productCategoryService;

    public ProductServiceImpl(ProductRepository productRepository, ProductCategoryRepository productCategoryRepository, ProductVariantService productVariantService, ProductImageService productImageService, ProductCategoryService productCategoryService) {
        this.productRepository = productRepository;
        this.productCategoryRepository = productCategoryRepository;
        this.productVariantService = productVariantService;
        this.productImageService = productImageService;
        this.productCategoryService = productCategoryService;
    }

    @Override
    public PageResponse<ProductResponse> getProducts(ProductFilter filter, Pageable pageable) {
        if (pageable.getSort().isUnsorted()){
            pageable = PageRequest.of(
                    pageable.getPageNumber(),
                    pageable.getPageSize(),
                    Sort.by(filter.getSortBy().equals("asc") ? Sort.Direction.ASC : Sort.Direction.DESC,
                            filter.getSortDir())
            );
        }

        Specification<Product> spec = ProductSpecification.withFilter(filter);

        Page<ProductResponse> productList = productRepository.findAll(spec, pageable)
                .map(product -> ProductResponse.builder()
                        .id(product.getId())
                        .name(product.getName())
                        .slug(product.getSlug())
                        .description(product.getDescription())
                        .brand(product.getBrand())
                        .weight(product.getWeight())
                        .active(product.isActive())
                        .createdAt(product.getCreatedAt())
                        .updatedAt(product.getUpdatedAt())
                        .build());

        return convertToPageResponse(productList);
    }

    @Override
    public ProductDetailResponse getProductById(Long id) {

        Product product = productRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_FOUND));

        List<CategoryResponse> categories = productCategoryService.getCategoriesByProductId(product.getId());

        List<ProductVariantResponse> variants = productVariantService.getVariantsByProductId(product.getId());

        List<ProductImageResponse> images = productImageService.getImagesByProductId(product.getId());

        return ProductDetailResponse.builder()
                .id(product.getId())
                .name(product.getName())
                .slug(product.getSlug())
                .description(product.getDescription())
                .brand(product.getBrand())
                .weight(product.getWeight())
                .active(product.isActive())
                .createdAt(product.getCreatedAt())
                .updatedAt(product.getUpdatedAt())
                .categories(categories)
                .primaryCategory(getPrimaryCategoryResponse(id))
                .variants(variants)
                .images(images)
                .build();
    }

    @Override
    @Transactional(rollbackFor = AppException.class)
    public ProductResponse createProduct(ProductCreateRequest request) {

        Product product = new Product();
        product.setName(request.getName());
        product.setSlug(request.getSlug());
        product.setDescription(request.getDescription());
        product.setBrand(request.getBrand());
        product.setWeight(request.getWeight());
        product.setActive(true);
        product.setCreatedAt(LocalDateTime.now());
        product.setUpdatedAt(LocalDateTime.now());

        product = productRepository.save(product);

        if (request.getCategoryIds() != null && !request.getCategoryIds().isEmpty()) {
            productCategoryService.assignCategoriesToProduct(product.getId(), request.getCategoryIds(), request.getPrimaryCategoryId());
        }

        if (request.getVariants() != null && !request.getVariants().isEmpty()) {
            for (ProductVariantCreateRequest variantRequest : request.getVariants()) {
                productVariantService.createVariant(product.getId(), variantRequest);
            }
        }

        if (request.getImages() != null && !request.getImages().isEmpty()) {
            for (ProductImageUploadRequest imageRequest : request.getImages()) {
                productImageService.uploadImage(product.getId(), imageRequest);
            }
        }

        log.debug("Created product with id {}", product.getId());
        return ProductResponse.builder()
                .id(product.getId())
                .name(product.getName())
                .slug(product.getSlug())
                .description(product.getDescription())
                .brand(product.getBrand())
                .weight(product.getWeight())
                .active(product.isActive())
                .createdAt(product.getCreatedAt())
                .updatedAt(product.getUpdatedAt())
                .build();
    }

    @Override
    @Transactional(rollbackFor = AppException.class)
    public void updateProduct(Long id, ProductUpdateRequest request) {

        Product product = productRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_FOUND));

        product.setName(request.getName());
        product.setSlug(request.getSlug());
        product.setDescription(request.getDescription());
        product.setBrand(request.getBrand());
        product.setWeight(request.getWeight());
        product.setActive(request.isActive());
        product.setUpdatedAt(LocalDateTime.now());
        productRepository.save(product);

        if (request.getCategoryIds() != null) {
            productCategoryService.assignCategoriesToProduct(id, request.getCategoryIds(), request.getPrimaryCategoryId());
        }

        if (request.getVariants() != null) {
            for (ProductVariantUpdateRequest variantRequest : request.getVariants()) {
                if (variantRequest.getId() == null) {

                } else {
                    productVariantService.updateVariant(variantRequest.getId(), variantRequest);
                }
            }
        }

        productRepository.save(product);
        log.debug("Updated product with id {}", product.getId());
    }

    @Override
    @Transactional(rollbackFor = AppException.class)
    public void deleteProduct(Long id) {

        Product product = productRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_FOUND));

        // check orders before delete

        productVariantService.deleteVariantsByProductId(id);
        productImageService.deleteAllImagesByProductId(id);
        productCategoryService.removeAllCategoriesFromProduct(id);

        productRepository.delete(product);
        log.debug("Deleted product with id {}", id);
    }

    private CategoryResponse getPrimaryCategoryResponse(Long productId) {
        return productCategoryRepository.findPrimaryCategoryByProductId(productId)
                .map(category -> CategoryResponse.builder()
                        .id(category.getId())
                        .name(category.getName())
                        .slug(category.getSlug())
                        .description(category.getDescription())
                        .build())
                .orElse(null);
    }

    public static <T> PageResponse<T> convertToPageResponse(Page<T> page) {
        return PageResponse.<T>builder()
                .content(page.getContent())
                .pageNumber(page.getNumber())
                .pageSize(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .last(page.isLast())
                .first(page.isFirst())
                .empty(page.isEmpty())
                .build();
    }

}
