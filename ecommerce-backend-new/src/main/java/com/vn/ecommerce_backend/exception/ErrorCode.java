package com.vn.ecommerce_backend.exception;

public enum ErrorCode {
    INVALID_REQUEST(1001, "INVALID_REQUEST", "Invalid request"),
    INVALID_EMAIL(1004, "INVALID_EMAIL", "Email is invalid"),
    INVALID_TOKEN(1005, "INVALID_TOKEN", "Invalid token"),
    UNAUTHORIZED(2001, "UNAUTHORIZED", "Unauthorized"),
    UNAUTHENTICATED(2002, "UNAUTHENTICATED", "Unauthenticated"),
    TOKEN_EXPIRED(2003, "TOKEN_EXPIRED", "Token expired"),
    ACCESS_DENIED(2005, "ACCESS_DENIED", "Access denied"),
    REFRESH_TOKEN_EXPIRED(2008, "REFRESH_TOKEN_EXPIRED", "Refresh token expired"),
    REFRESH_TOKEN_NOT_FOUND(2009, "REFRESH_TOKEN_NOT_FOUND", "Refresh token not found"),
    EMAIL_ALREADY_EXISTS(3002, "EMAIL_ALREADY_EXISTS", "Email already exists"),
    USER_ALREADY_EXISTS(3003, "USER_ALREADY_EXISTS", "User already exists"),
    TOKEN_USED(3004, "TOKEN_USED", "Token used"),
    EMAIL_NOT_VERIFIED(3005, "EMAIL_NOT_VERIFIED", "Email not verified"),
    EMAIL_ALREADY_VERIFIED(3006, "EMAIL_ALREADY_VERIFIED", "Email verified"),
    PASSWORD_NOT_CORRECT(3007, "PASSWORD_NOT_CORRECT", "Password not correct"),
    INFORMATION_LOGIN_NOT_CORRECT(3008, "INFORMATION_LOGIN_NOT_CORRECT", "Information login not correct"),
    TOKEN_TYPE_NOT_SUPPORTED(3009, "TOKEN_TYPE_NOT_SUPPORTED", "Token type not supported"),
    REFRESH_TOKEN_FAILED(3010, "REFRESH_TOKEN_FAILED", "Refresh token failed"),
    LOGIN_FAILED(3011, "LOGIN_FAILED", "Login failed"),
    CATEGORY_ALREADY_EXISTS(3012, "CATEGORY_ALREADY_EXISTS", "Category already exists"),
    SLUG_ALREADY_EXISTS(3013, "SLUG_ALREADY_EXISTS", "Slug already exists"),
    CATEGORY_HAS_CHILDREN(3014, "CATEGORY_HAS_CHILDREN", "Category has children"),
    CANNOT_DELETE_VARIANT_WITH_STOCK(3015, "CANNOT_DELETE_VARIANT_WITH_STOCK", "Cannot delete variant with stock"),
    CANNOT_UPLOAD_IMAGE(3016, "CANNOT_UPLOAD_IMAGE", "Cannot upload image"),
    IMAGE_FILE_IS_EMPTY(3017, "IMAGE_FILE_IS_EMPTY", "Image file is empty"),
    CATEGORY_CIRCULAR_REFERENCE(3018, "CATEGORY_CIRCULAR_REFERENCE", "Category circular reference"),
    CART_EMPTY(3019, "CART_EMPTY", "Cart is empty"),
    INSUFFICIENT_STOCK(3020, "INSUFFICIENT_STOCK", "Insufficient stock"),
    USER_NOT_FOUND(4002, "USER_NOT_FOUND", "User not found"),
    PRODUCT_NOT_FOUND(4004, "PRODUCT_NOT_FOUND", "Product not found"),
    ROLE_NOT_FOUND(4005, "ROLE_NOT_FOUND", "Role not found"),
    EMAIL_NOT_FOUND(4006, "EMAIL_NOT_FOUND", "Email not found"),
    ADDRESS_NOT_FOUND(4007, "ADDRESS_NOT_FOUND", "Address not found"),
    ORDER_NOT_FOUND(4008, "ORDER_NOT_FOUND", "Order not found"),
    CATEGORY_NOT_FOUND(4009, "CATEGORY_NOT_FOUND", "Category not found"),
    PRODUCT_VARIANT_NOT_FOUND(4010, "PRODUCT_VARIANT_NOT_FOUND", "Product variant not found"),
    PRODUCT_IMAGE_NOT_FOUND(4011, "PRODUCT_IMAGE_NOT_FOUND", "Product image not found"),
    ;

    private final int statusCode;
    private final String name;
    private final String message;

    ErrorCode(int statusCode, String name, String message) {
        this.statusCode = statusCode;
        this.name = name;
        this.message = message;
    }

    public int getStatusCode() {
        return statusCode;
    }

    public String getName() {
        return name;
    }

    public String getMessage() {
        return message;
    }
}
