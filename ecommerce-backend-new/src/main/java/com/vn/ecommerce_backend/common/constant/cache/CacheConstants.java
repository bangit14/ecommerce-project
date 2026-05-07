package com.vn.ecommerce_backend.common.constant.cache;

public class CacheConstants {

    // Cache names (dùng làm prefix trong Redis)
    public static final String CATEGORY_TREE            = "category:tree";
    public static final String CATEGORY_ROOT            = "category:root";
    public static final String CATEGORY_CHILDREN        = "category:children";
    public static final String CATEGORY_DESCENDANT_IDS  = "category:descendant-ids";
    public static final String CATEGORY_ALL_ACTIVE      = "category:all-active";
    public static final String CATEGORY_BY_ID           = "category:by-id";

    // SpEL key expressions dùng trong @Cacheable / @CacheEvict
    public static final String KEY_ALL          = "'all'";
    public static final String KEY_PARENT_ID    = "#parentId";
    public static final String KEY_CATEGORY_ID  = "#categoryId";
    public static final String KEY_ID           = "#id";
}
