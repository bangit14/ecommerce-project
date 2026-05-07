package com.vn.ecommerce_backend.service;

import com.vn.ecommerce_backend.dto.request.*;
import com.vn.ecommerce_backend.dto.response.PageResponse;
import com.vn.ecommerce_backend.dto.response.UserDetailResponse;
import com.vn.ecommerce_backend.dto.response.UserResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface UserService {

    PageResponse<UserResponse> getUsers(UserFilter userFilter, Pageable pageable);

    UserDetailResponse getCurrentUser();

    UserDetailResponse getUserDetail(Long id);

    UserResponse createUser(UserCreateRequest request);

    void updateUser(Long id, UserUpdateRequest request);

    void deleteUser(Long id);

    void updateProfile(Long id, ProfileUpdateRequest request);

    void resetPassword(ResetPasswordRequest request);

    void changePassword(Long id, ChangePasswordRequest request);
}
