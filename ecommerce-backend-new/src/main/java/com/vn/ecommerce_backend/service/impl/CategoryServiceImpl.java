package com.vn.ecommerce_backend.service.impl;

import com.vn.ecommerce_backend.common.constant.cache.CacheConstants;
import com.vn.ecommerce_backend.dto.request.CategoryCreateRequest;
import com.vn.ecommerce_backend.dto.request.CategoryFilter;
import com.vn.ecommerce_backend.dto.request.CategoryUpdateRequest;
import com.vn.ecommerce_backend.dto.response.CategoryResponse;
import com.vn.ecommerce_backend.dto.response.CategorySelectResponse;
import com.vn.ecommerce_backend.dto.response.CategoryTreeResponse;
import com.vn.ecommerce_backend.dto.response.PageResponse;
import com.vn.ecommerce_backend.entity.Category;
import com.vn.ecommerce_backend.exception.AppException;
import com.vn.ecommerce_backend.exception.ErrorCode;
import com.vn.ecommerce_backend.repository.CategoryRepository;
import com.vn.ecommerce_backend.service.CategoryService;
import com.vn.ecommerce_backend.specification.CategorySpecification;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@Slf4j(topic = "Category-Service")
public class CategoryServiceImpl implements CategoryService {

    private final CategoryRepository categoryRepository;

    public CategoryServiceImpl(CategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }


    @Override
    public PageResponse<CategoryResponse> getAllCategories(CategoryFilter filter, Pageable pageable) {

        if (pageable.getSort().isUnsorted()){
            pageable = PageRequest.of(
                    pageable.getPageNumber(),
                    pageable.getPageSize(),
                    Sort.by(Sort.Direction.ASC, "createdAt")
            );
        }

        Specification<Category> spec = CategorySpecification.withFilter(filter);

        Page<CategoryResponse> categoryList = categoryRepository.findAll(spec, pageable)
                .map(category -> CategoryResponse.builder()
                        .id(category.getId())
                        .name(category.getName())
                        .slug(category.getSlug())
                        .parentId(category.getParent() != null ? category.getParent().getId() : null)
                        .description(category.getDescription())
                        .path(category.getPath())
                        .imageUrl(category.getImageUrl())
                        .iconUrl(category.getIconUrl())
                        .createdAt(category.getCreatedAt())
                        .updatedAt(category.getUpdatedAt())
                        .build());

        return convertToPageResponse(categoryList);
    }

    @Override
    public CategoryResponse getCategoryById(Long id) {

        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.CATEGORY_NOT_FOUND));

        return mapToCategoryResponse(category);
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = CacheConstants.CATEGORY_ALL_ACTIVE, key = "T(String).valueOf(#excludeCategoryId)")
    public List<CategorySelectResponse> getAvailableParents(Long excludeCategoryId) {
        List<Category> allCategories = categoryRepository.findAllOrderedForAdmin();

        if (excludeCategoryId == null){
            return allCategories.stream()
                    .map(cat -> CategorySelectResponse.builder()
                            .id(cat.getId())
                            .name(cat.getName())
                            .build())
                    .toList();
        }

        String excludePath = allCategories.stream()
                .filter(c -> c.getId().equals(excludeCategoryId))
                .findFirst()
                .map(Category::getPath)
                .orElse(null);

        return allCategories.stream()
                .filter(c -> !c.getId().equals(excludeCategoryId))
                .filter(c -> excludePath == null
                        || (!c.getPath().startsWith(excludePath + "/")
                        && !c.getPath().equals(excludePath)))
                .map(cat -> CategorySelectResponse.builder()
                        .id(cat.getId())
                        .name(cat.getName())
                        .build())
                .toList();
    }

    @Override
    @Transactional(rollbackFor = AppException.class)
    @Caching(evict = {
            @CacheEvict(value = CacheConstants.CATEGORY_TREE,           allEntries = true),
            @CacheEvict(value = CacheConstants.CATEGORY_ROOT,           allEntries = true),
            @CacheEvict(value = CacheConstants.CATEGORY_CHILDREN,       allEntries = true),
            @CacheEvict(value = CacheConstants.CATEGORY_DESCENDANT_IDS, allEntries = true),
            @CacheEvict(value = CacheConstants.CATEGORY_ALL_ACTIVE,     allEntries = true),
    })
    public CategoryResponse createCategory(CategoryCreateRequest request) {

        if (categoryRepository.findBySlug(request.getSlug()).isPresent()) {
            throw new AppException(ErrorCode.CATEGORY_ALREADY_EXISTS);
        }

        Category category = new Category();
        category.setName(request.getName());
        category.setSlug(request.getSlug());
        category.setDescription(request.getDescription());
        category.setImageUrl(request.getImageUrl());
        category.setIconUrl(request.getIconUrl());
        categoryRepository.save(category);

        if (request.getParentId() != null){
            Category parentCategory = categoryRepository.findById(request.getParentId())
                    .orElseThrow(() -> new AppException(ErrorCode.CATEGORY_NOT_FOUND));
            category.setParent(parentCategory);
            category.setLevel(parentCategory.getLevel() + 1);
            category.setPath(parentCategory.getPath() + "." + category.getId());
        } else {
            category.setLevel(0);
        }

        Category saved = categoryRepository.save(category);

        if (saved.getParent() == null){
            saved.setPath(String.valueOf(saved.getId()));
        } else {
            saved.setPath(saved.getParent().getPath() + "." + saved.getId());
        }

        category.setCreatedAt(LocalDateTime.now());
        category.setUpdatedAt(LocalDateTime.now());
        saved = categoryRepository.save(saved);

        log.debug("Created Category: {}", saved);

        return mapToCategoryResponse(category);
    }

    @Override
    @Transactional(rollbackFor = AppException.class)
    public void updateCategory(Long id, CategoryUpdateRequest request) {

        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.CATEGORY_NOT_FOUND));

        if (categoryRepository.existsBySlugAndIdNot(request.getSlug(), id)) {
            throw new AppException(ErrorCode.SLUG_ALREADY_EXISTS);
        }

        category.setName(request.getName());
        category.setSlug(request.getSlug());
        category.setDescription(request.getDescription());
        category.setImageUrl(request.getImageUrl());
        category.setIconUrl(request.getIconUrl());
        category.setActive(request.isActive());
        category.setSortOrder(request.getSortOrder());

        if (hasParentChanged(category, request.getParentId())) {
            validateNoCircularReference(category, request.getParentId());

            Category newParent = request.getParentId() == null ?
                    null :
                    categoryRepository.findById(request.getParentId())
                            .orElseThrow(() -> new AppException(ErrorCode.CATEGORY_NOT_FOUND));

            String oldPath = category.getPath();
            String oldPathPrefix = oldPath + "/";

            String newPath = newParent == null ? String.valueOf(category.getId())
                    : newParent.getPath() + "." + id;

            int newLevel = newParent == null ? 0 : newParent.getLevel() + 1;

            category.setParent(newParent);
            category.setPath(newPath);
            category.setLevel(newLevel);

            int updatedRows = categoryRepository.bulkUpdateSubtreePaths(oldPath, newPath, oldPathPrefix);
            log.info("Bulk updated {} subtree nodes: oldPath={} → newPath={}", updatedRows, oldPath, newPath);
        }

        category.setUpdatedAt(LocalDateTime.now());
        categoryRepository.save(category);
        log.debug("Category updated: " + category.getName());
    }

    @Override
    @Transactional(rollbackFor = AppException.class)
    @Caching(evict = {
            @CacheEvict(value = CacheConstants.CATEGORY_TREE,           allEntries = true),
            @CacheEvict(value = CacheConstants.CATEGORY_ROOT,           allEntries = true),
            @CacheEvict(value = CacheConstants.CATEGORY_CHILDREN,       allEntries = true),
            @CacheEvict(value = CacheConstants.CATEGORY_DESCENDANT_IDS, allEntries = true),
            @CacheEvict(value = CacheConstants.CATEGORY_ALL_ACTIVE,     allEntries = true),
            @CacheEvict(value = CacheConstants.CATEGORY_BY_ID,          key = CacheConstants.KEY_ID),
    })
    public void deleteCategory(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.CATEGORY_NOT_FOUND));

        if (!category.getChildren().isEmpty()) {
            throw new AppException(ErrorCode.CATEGORY_HAS_CHILDREN);
        }

        // Thêm kiểm tra nếu có sản phẩm nào đang thuộc danh mục này thì không cho xóa

        categoryRepository.delete(category);
        log.debug("Category deleted: " + category.getName());
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = CacheConstants.CATEGORY_ROOT, key = CacheConstants.KEY_ALL)
    public List<CategoryResponse> getRootCategories() {

        List<Category> rootCategories = categoryRepository.findActiveRootCategories();

        return rootCategories.stream()
                .map(category -> CategoryResponse.builder()
                        .id(category.getId())
                        .name(category.getName())
                        .slug(category.getSlug())
                        .parentId(null)
                        .description(category.getDescription())
                        .path(category.getPath())
                        .imageUrl(category.getImageUrl())
                        .iconUrl(category.getIconUrl())
                        .build())
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = CacheConstants.CATEGORY_CHILDREN, key = CacheConstants.KEY_PARENT_ID)
    public List<CategoryResponse> getChildCategories(Long parentId) {

        if (!categoryRepository.existsById(parentId)) {
            throw new AppException(ErrorCode.CATEGORY_NOT_FOUND);
        }

        return categoryRepository.findChildrenCategoryByParentId(parentId)
                .stream()
                .map(category -> CategoryResponse.builder()
                        .id(category.getId())
                        .name(category.getName())
                        .slug(category.getSlug())
                        .parentId(parentId)
                        .description(category.getDescription())
                        .path(category.getPath())
                        .imageUrl(category.getImageUrl())
                        .iconUrl(category.getIconUrl())
                        .build())
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = CacheConstants.CATEGORY_TREE, key = CacheConstants.KEY_ALL)
    public List<CategoryTreeResponse> getCategoryTree() {

        List<Category> allWithChildren = categoryRepository.findAllActiveWithChildren();

        return allWithChildren.stream()
                .filter(c -> c.getParent() == null)
                .map(this::buildTreeNode)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = CacheConstants.CATEGORY_TREE, key = "#parentId")
    public List<CategoryTreeResponse> getCategoryTreeByParentId(Long parentId) {

        return categoryRepository.findChildrenCategoryByParentId(parentId)
                .stream()
                .map(this::buildTreeNode)
                .toList();
    }


    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = CacheConstants.CATEGORY_DESCENDANT_IDS, key = CacheConstants.KEY_CATEGORY_ID)
    public List<Long> getAllDescendantCategoryIds(Long categoryId) {

        Category root = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new AppException(ErrorCode.CATEGORY_NOT_FOUND));

        return categoryRepository.findAllDescendantIds(root.getPath());
    }

    private boolean hasParentChanged(Category category, Long newParentId) {
        if (category.getParent() == null) {
            return newParentId != null;
        }
        return !category.getParent().getId().equals(newParentId);
    }

    private CategoryTreeResponse buildTreeNode(Category category) {
        CategoryTreeResponse node = CategoryTreeResponse.builder()
                .id(category.getId())
                .name(category.getName())
                .slug(category.getSlug())
                .parentId(category.getParent() != null ? category.getParent().getId() : null)
                .description(category.getDescription())
                .path(category.getPath())
                .imageUrl(category.getImageUrl())
                .iconUrl(category.getIconUrl())
                .build();

        List<CategoryTreeResponse> children = category.getChildren()
                .stream()
                .filter(Category::isActive)
                .sorted((a, b) -> {
                    int cmp = Integer.compare(
                            a.getSortOrder() != null ? a.getSortOrder() : 0,
                            b.getSortOrder() != null ? b.getSortOrder() : 0
                    );
                    return cmp != 0 ? cmp : a.getName().compareTo(b.getName());
                })
                .map(this::buildTreeNode)
                .toList();

        if (!children.isEmpty()) {
            node.setChildren(children);
        }

        return node;
    }

    private void validateNoCircularReference(Category category, Long newParentId) {
        if (newParentId == null) return;

        if (newParentId.equals(category.getId())) {
            throw new AppException(ErrorCode.CATEGORY_CIRCULAR_REFERENCE);
        }

        Category newParent = categoryRepository.findById(newParentId)
                .orElseThrow(() -> new AppException(ErrorCode.CATEGORY_NOT_FOUND));

        String currentPath = category.getPath();
        if (newParent.getPath().startsWith(currentPath + "/") || newParent.getPath().equals(currentPath)) {
            throw new AppException(ErrorCode.CATEGORY_CIRCULAR_REFERENCE);
        }
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

    private CategoryResponse mapToCategoryResponse(Category category) {
        return CategoryResponse.builder()
                .id(category.getId())
                .name(category.getName())
                .slug(category.getSlug())
                .parentId(category.getParent() != null ? category.getParent().getId() : null)
                .description(category.getDescription())
                .path(category.getPath())
                .imageUrl(category.getImageUrl())
                .iconUrl(category.getIconUrl())
                .createdAt(category.getCreatedAt())
                .updatedAt(category.getUpdatedAt())
                .build();
    }
}
