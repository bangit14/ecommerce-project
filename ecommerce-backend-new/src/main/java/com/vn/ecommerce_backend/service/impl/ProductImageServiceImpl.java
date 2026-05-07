package com.vn.ecommerce_backend.service.impl;

import com.vn.ecommerce_backend.dto.request.ProductImageUploadRequest;
import com.vn.ecommerce_backend.dto.response.ProductImageResponse;
import com.vn.ecommerce_backend.entity.Product;
import com.vn.ecommerce_backend.entity.ProductImage;
import com.vn.ecommerce_backend.entity.ProductVariant;
import com.vn.ecommerce_backend.exception.AppException;
import com.vn.ecommerce_backend.exception.ErrorCode;
import com.vn.ecommerce_backend.repository.ProductImageRepository;
import com.vn.ecommerce_backend.repository.ProductRepository;
import com.vn.ecommerce_backend.repository.ProductVariantRepository;
import com.vn.ecommerce_backend.service.MinioStorageService;
import com.vn.ecommerce_backend.service.ProductImageService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Service
@Slf4j(topic = "Product-Image-Service")
public class ProductImageServiceImpl implements ProductImageService {

    private final MinioStorageService minioStorageService;
    private final ProductImageRepository productImageRepository;
    private final ProductVariantRepository productVariantRepository;
    private final ProductRepository productRepository;

    public ProductImageServiceImpl(MinioStorageService minioStorageService, ProductImageRepository productImageRepository, ProductVariantRepository productVariantRepository, ProductRepository productRepository) {
        this.minioStorageService = minioStorageService;
        this.productImageRepository = productImageRepository;
        this.productVariantRepository = productVariantRepository;
        this.productRepository = productRepository;
    }

    @Override
    public List<ProductImageResponse> getImagesByProductId(Long productId) {

        List<ProductImage> images = productImageRepository.findByProductId(productId);

        return images.stream().map(
                img -> ProductImageResponse.builder()
                        .id(img.getId())
                        .imageUrl(img.getImageUrl())
                        .altText(img.getAltText())
                        .isMain(img.isMain())
                        .sortOrder(img.getSortOrder())
                        .variantId(img.getVariant() != null ? img.getVariant().getId() : null)
                        .build()
        ).toList();
    }

    @Override
    public void uploadImage(Long productId, ProductImageUploadRequest request) {
        if (request.getFile() == null || request.getFile().isEmpty()) {
            throw new AppException(ErrorCode.IMAGE_FILE_IS_EMPTY);
        }

        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_FOUND));

        ProductVariant variant = productVariantRepository.findById(request.getVariantId())
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_VARIANT_NOT_FOUND));

        String imageUrl = minioStorageService.uploadImage(request.getFile(), "products");

        if (request.isMain()) {
            resetMainImage(productId);
        }

        ProductImage productImage = new ProductImage();
        productImage.setProduct(product);
        productImage.setVariant(variant);
        productImage.setImageUrl(imageUrl);
        productImage.setAltText(product.getName() + " - " + (variant != null ? variant.getAttributes() : "Chung"));
        productImage.setMain(request.isMain());
        productImage.setSortOrder(getNextSortOrder(productId));

        productImageRepository.save(productImage);

        log.debug("Uploaded image successfully for productId={}", productId);
    }

    @Override
    public void deleteImage(Long imageId) {
        ProductImage image = productImageRepository.findById(imageId)
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_IMAGE_NOT_FOUND));

        // Xóa file thật trên MinIO trước
        try {
            minioStorageService.deleteFile(image.getImageUrl());
        } catch (Exception e) {
            log.warn("Failed to delete file from MinIO, but continuing to delete from DB: {}", image.getImageUrl());
        }

        productImageRepository.delete(image);
        log.info("Deleted image with id: {}", imageId);
    }

    @Transactional
    public void deleteAllImagesByProductId(Long productId) {
        List<ProductImage> images = productImageRepository.findByProductId(productId);

        // Xóa file trên MinIO
        for (ProductImage image : images) {
            try {
                minioStorageService.deleteFile(image.getImageUrl());
            } catch (Exception e) {
                log.warn("Failed to delete MinIO file: {}", image.getImageUrl());
            }
        }

        productImageRepository.deleteByProductId(productId);
        log.info("Deleted all images for productId: {}", productId);
    }

    /**
     * Reset tất cả ảnh chính thành false trước khi set ảnh mới là main
     */
    private void resetMainImage(Long productId) {
        productImageRepository.updateIsMainToFalse(productId);
    }

    private Integer getNextSortOrder(Long productId) {
        Integer maxOrder = productImageRepository.getMaxSortOrderByProductId(productId);
        return maxOrder == null ? 0 : maxOrder + 10;
    }
}
