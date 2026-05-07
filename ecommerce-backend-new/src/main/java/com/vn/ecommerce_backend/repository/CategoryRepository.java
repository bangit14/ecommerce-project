package com.vn.ecommerce_backend.repository;

import com.vn.ecommerce_backend.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CategoryRepository extends JpaRepository<Category, Long>, JpaSpecificationExecutor<Category> {

    Optional<Category> findBySlug(String slug);

    boolean existsBySlug(String slug);

    boolean existsBySlugAndIdNot(String slug, Long id);

    @Query("SELECT c FROM Category c ORDER BY c.level ASC, c.sortOrder ASC, c.name ASC")
    List<Category> findAllOrderedForAdmin();

    @Modifying
    @Query(value = """
            UPDATE categories
            SET path  = REPLACE(path, :oldPath, :newPath),
                level = LENGTH(REPLACE(path, '/', '')) - LENGTH(REPLACE(REPLACE(path, :oldPath, :newPath), '/', ''))
            WHERE path LIKE :oldPathPrefix
            """, nativeQuery = true)
    int bulkUpdateSubtreePaths(
            @Param("oldPath") String oldPath,
            @Param("newPath") String newPath,
            @Param("oldPathPrefix") String oldPathPrefix
    );

    @Query("SELECT c FROM Category c " +
            "WHERE c.parent IS NULL AND " +
            "c.isActive = true " +
            "ORDER BY c.sortOrder ASC")
    List<Category> findActiveRootCategories();

    @Query("SELECT c FROM Category c " +
            "WHERE c.parent.id = :parentId AND " +
            "c.isActive = true " +
            "ORDER BY c.sortOrder ASC")
    List<Category> findChildrenCategoryByParentId(Long parentId);

    @Query("SELECT DISTINCT c FROM Category c " +
            "LEFT JOIN FETCH c.children ch " +
            "WHERE c.isActive = true ORDER BY c.level ASC, c.sortOrder ASC")
    List<Category> findAllActiveWithChildren();

    @Query("SELECT c FROM Category c " +
            "WHERE c.parent.id = :parentId " +
            "AND c.isActive = true ORDER BY c.sortOrder ASC, c.name ASC")
    List<Category> findActiveChildrenByParentId(@Param("parentId") Long parentId);

    @Query("SELECT c.id FROM Category c WHERE c.path LIKE CONCAT(:path, '.%')")
    List<Long> findAllDescendantIds(@Param("path") String path);

}
