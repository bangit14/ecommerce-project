package com.vn.ecommerce_backend.controller;

import com.vn.ecommerce_backend.common.util.PageableUtils;
import com.vn.ecommerce_backend.dto.request.*;
import com.vn.ecommerce_backend.dto.response.PageResponse;
import com.vn.ecommerce_backend.dto.response.ProductDetailResponse;
import com.vn.ecommerce_backend.dto.response.ProductResponse;
import com.vn.ecommerce_backend.dto.response.ProductVariantResponse;
import com.vn.ecommerce_backend.service.ProductImageService;
import com.vn.ecommerce_backend.service.ProductService;
import com.vn.ecommerce_backend.service.ProductVariantService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/products")
@Slf4j(topic = "Product-Controller")
public class ProductController {

    private final ProductService productService;
    private final ProductVariantService productVariantService;
    private final ProductImageService productImageService;

    public ProductController(ProductService productService, ProductVariantService productVariantService, ProductImageService productImageService) {
        this.productService = productService;
        this.productVariantService = productVariantService;
        this.productImageService = productImageService;
    }

    @GetMapping("/list")
    public ResponseEntity<PageResponse<ProductResponse>> getProducts(
            @ModelAttribute ProductFilter filter,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String sortBy,
            @RequestParam(required = false) String sortDir) {

        Pageable pageable = PageableUtils.createPageable(page, size, sortBy, sortDir);

        PageResponse<ProductResponse> products = productService.getProducts(filter, pageable);

        return ResponseEntity.ok(products);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProductDetailResponse> getProductById(@PathVariable Long id) {
        return ResponseEntity.ok(productService.getProductById(id));
    }

    @PostMapping("/create")
    public ResponseEntity<ProductResponse> createProduct(@RequestBody ProductCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(productService.createProduct(request));
    }

    @PutMapping("/update/{id}")
    public ResponseEntity<Void> updateProduct(@PathVariable Long id, @RequestBody ProductUpdateRequest request) {
        productService.updateProduct(id, request);
        return ResponseEntity.status(HttpStatus.ACCEPTED).build();
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<Void> deleteProduct(@PathVariable Long id) {
        productService.deleteProduct(id);
        return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
    }

    @PostMapping("/{id}/images")
    public ResponseEntity<Void> uploadProductImage(@PathVariable Long id, @ModelAttribute ProductImageUploadRequest request) {
        productImageService.uploadImage(id, request);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @DeleteMapping("/images/{imageId}")
    public ResponseEntity<Void> deleteProductImage(@PathVariable Long imageId) {
        productImageService.deleteImage(imageId);
        return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
    }

    @GetMapping("/{id}/variants")
    public ResponseEntity<List<ProductVariantResponse>> getProductVariants(@PathVariable Long id) {
        return ResponseEntity.ok(productVariantService.getVariantsByProductId(id));
    }

    @PostMapping("/{id}/variants")
    public ResponseEntity<ProductVariantResponse> addProductVariant(@PathVariable Long id, @RequestBody ProductVariantCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(productVariantService.createVariant(id, request));
    }

    @PutMapping("/variants/{variantId}")
    public ResponseEntity<Void> updateProductVariant(@PathVariable Long variantId, @RequestBody ProductVariantUpdateRequest request) {
        productVariantService.updateVariant(variantId, request);
        return ResponseEntity.status(HttpStatus.ACCEPTED).build();
    }

    @DeleteMapping("/variants/{variantId}")
    public ResponseEntity<Void> deleteProductVariant(@PathVariable Long variantId) {
        productVariantService.deleteVariant(variantId);
        return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
    }


}
