package com.vn.ecommerce_backend.exception;

import com.vn.ecommerce_backend.dto.response.ApiErrorResponse;
import io.jsonwebtoken.JwtException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(AppException.class)
    public ResponseEntity<ApiErrorResponse> handleAppException(AppException ex) {

        ErrorCode errorCode = ex.getErrorCode();
        HttpStatus httpStatus = mapHttpStatus(errorCode);

        ApiErrorResponse error = ApiErrorResponse.builder()
                .status(errorCode.getStatusCode())
                .error(errorCode.name())
                .message(errorCode.getMessage())
                .timestamp(LocalDateTime.now())
                .build();

        return ResponseEntity.status(httpStatus).body(error);
    }

    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ApiErrorResponse> handleAuthenticationException(AuthenticationException ex) {
        ApiErrorResponse error = ApiErrorResponse.builder()
                .status(ErrorCode.UNAUTHORIZED.getStatusCode())
                .error(ErrorCode.UNAUTHORIZED.name())
                .message(ErrorCode.UNAUTHORIZED.getMessage())
                .timestamp(LocalDateTime.now())
                .build();

        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiErrorResponse> handleAccessDeniedException(AccessDeniedException ex) {
        ApiErrorResponse error = ApiErrorResponse.builder()
                .status(ErrorCode.ACCESS_DENIED.getStatusCode())
                .error(ErrorCode.ACCESS_DENIED.name())
                .message(ErrorCode.ACCESS_DENIED.getMessage())
                .timestamp(LocalDateTime.now())
                .build();

        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error);
    }

    private HttpStatus mapHttpStatus(ErrorCode errorCode) {
        return switch (errorCode) {
            case UNAUTHORIZED,
                 UNAUTHENTICATED,
                 INFORMATION_LOGIN_NOT_CORRECT,
                 LOGIN_FAILED,
                 TOKEN_EXPIRED -> HttpStatus.UNAUTHORIZED;

            case ACCESS_DENIED -> HttpStatus.FORBIDDEN;

            case USER_NOT_FOUND,
                 PRODUCT_NOT_FOUND,
                 ROLE_NOT_FOUND,
                 CATEGORY_NOT_FOUND,
                 EMAIL_NOT_FOUND,
                 PRODUCT_VARIANT_NOT_FOUND,
                 PRODUCT_IMAGE_NOT_FOUND,
                 REFRESH_TOKEN_NOT_FOUND -> HttpStatus.NOT_FOUND;

            case EMAIL_ALREADY_EXISTS,
                 USER_ALREADY_EXISTS,
                 CATEGORY_ALREADY_EXISTS,
                 SLUG_ALREADY_EXISTS,
                 EMAIL_ALREADY_VERIFIED,
                 CANNOT_DELETE_VARIANT_WITH_STOCK,
                 CANNOT_UPLOAD_IMAGE,
                 IMAGE_FILE_IS_EMPTY,
                 CATEGORY_HAS_CHILDREN,
                 CATEGORY_CIRCULAR_REFERENCE,
                 CART_EMPTY,
                 INSUFFICIENT_STOCK,
                 TOKEN_USED -> HttpStatus.CONFLICT;

            case INVALID_REQUEST,
                 INVALID_EMAIL,
                 INVALID_TOKEN,
                 PASSWORD_NOT_CORRECT,
                 EMAIL_NOT_VERIFIED,
                 TOKEN_TYPE_NOT_SUPPORTED,
                 REFRESH_TOKEN_FAILED -> HttpStatus.BAD_REQUEST;

            default -> HttpStatus.INTERNAL_SERVER_ERROR;
        };
    }
}
