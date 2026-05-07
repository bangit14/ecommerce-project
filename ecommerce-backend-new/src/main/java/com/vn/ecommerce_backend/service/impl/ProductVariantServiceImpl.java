package com.vn.ecommerce_backend.service.impl;

import com.vn.ecommerce_backend.dto.request.ProductVariantCreateRequest;
import com.vn.ecommerce_backend.dto.request.ProductVariantUpdateRequest;
import com.vn.ecommerce_backend.dto.response.ProductVariantResponse;
import com.vn.ecommerce_backend.entity.Product;
import com.vn.ecommerce_backend.entity.ProductVariant;
import com.vn.ecommerce_backend.exception.AppException;
import com.vn.ecommerce_backend.exception.ErrorCode;
import com.vn.ecommerce_backend.repository.ProductRepository;
import com.vn.ecommerce_backend.repository.ProductVariantRepository;
import com.vn.ecommerce_backend.service.ProductVariantService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@Slf4j(topic = "Product-Variant-Service")
public class ProductVariantServiceImpl implements ProductVariantService {

    private final ProductVariantRepository productVariantRepository;
    private final ProductRepository productRepository;

    public ProductVariantServiceImpl(ProductVariantRepository productVariantRepository, ProductRepository productRepository) {
        this.productVariantRepository = productVariantRepository;
        this.productRepository = productRepository;
    }

    @Override
    public List<ProductVariantResponse> getVariantsByProductId(Long productId) {

        List<ProductVariant> variants = productVariantRepository.findByProductIdOrderByIsDefaultDesc(productId);

        return variants.stream().map(
                v -> ProductVariantResponse.builder()
                        .id(v.getId())
                        .sku(v.getSku())
                        .price(v.getPrice())
                        .compareAtPrice(v.getCompareAtPrice())
                        .stockQuantity(v.getStockQuantity())
                        .weight(v.getWeight())
                        .attributes(v.getAttributes())
                        .isDefault(v.isDefault())
                        .createdAt(v.getCreatedAt())
                        .updatedAt(v.getUpdatedAt())
                        .build()
        ).toList();
    }

    @Override
    public ProductVariantResponse createVariant(Long productId, ProductVariantCreateRequest request) {

        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_FOUND));

        if (request.isDefault()){
            productVariantRepository.resetDefaultVariant(productId);
        }

        ProductVariant variant = new ProductVariant();
        variant.setSku(request.getSku());
        variant.setPrice(request.getPrice());
        variant.setCompareAtPrice(request.getCompareAtPrice());
        variant.setStockQuantity(request.getStockQuantity());
        variant.setWeight(request.getWeight());
        variant.setAttributes(request.getAttributes());
        variant.setDefault(request.isDefault());
        variant.setProduct(product);
        variant.setCreatedAt(LocalDateTime.now());
        variant.setUpdatedAt(LocalDateTime.now());

        productVariantRepository.save(variant);

        return ProductVariantResponse.builder()
                .id(variant.getId())
                .sku(variant.getSku())
                .price(variant.getPrice())
                .compareAtPrice(variant.getCompareAtPrice())
                .stockQuantity(variant.getStockQuantity())
                .weight(variant.getWeight())
                .attributes(variant.getAttributes())
                .isDefault(variant.isDefault())
                .createdAt(variant.getCreatedAt())
                .updatedAt(variant.getUpdatedAt())
                .build();
    }

    @Override
    @Transactional(rollbackFor = AppException.class)
    public void updateVariant(Long variantId, ProductVariantUpdateRequest request) {
        ProductVariant variant = productVariantRepository.findById(variantId)
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_VARIANT_NOT_FOUND));

        if (request.isDefault()){
            productVariantRepository.resetDefaultVariant(variant.getProduct().getId());
        }

        variant.setSku(request.getSku());
        variant.setPrice(request.getPrice());
        variant.setCompareAtPrice(request.getCompareAtPrice());
        variant.setStockQuantity(request.getStockQuantity());
        variant.setWeight(request.getWeight());
        variant.setAttributes(request.getAttributes());
        variant.setDefault(request.isDefault());
        variant.setUpdatedAt(LocalDateTime.now());

        productVariantRepository.save(variant);
    }

    @Override
    @Transactional(rollbackFor = AppException.class)
    public void deleteVariant(Long variantId) {
        ProductVariant variant = productVariantRepository.findById(variantId)
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_VARIANT_NOT_FOUND));

        if (variant.getStockQuantity() > 0) {
            throw new AppException(ErrorCode.CANNOT_DELETE_VARIANT_WITH_STOCK);
        }

        productVariantRepository.delete(variant);
    }

    @Override
    @Transactional(rollbackFor = AppException.class)
    public void deleteVariantsByProductId(Long productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_FOUND));

        for (ProductVariant variant : product.getVariants()) {
            if (variant.getStockQuantity() > 0) {
                throw new AppException(ErrorCode.CANNOT_DELETE_VARIANT_WITH_STOCK);
            }
        }

        productVariantRepository.deleteByProductId(productId);
    }
}
