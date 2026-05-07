package com.vn.ecommerce_backend.service.impl;

import com.vn.ecommerce_backend.common.constant.security.CustomUserDetails;
import com.vn.ecommerce_backend.dto.request.*;
import com.vn.ecommerce_backend.dto.response.PageResponse;
import com.vn.ecommerce_backend.dto.response.UserDetailResponse;
import com.vn.ecommerce_backend.dto.response.UserResponse;
import com.vn.ecommerce_backend.entity.User;
import com.vn.ecommerce_backend.entity.UserHasRole;
import com.vn.ecommerce_backend.exception.AppException;
import com.vn.ecommerce_backend.exception.ErrorCode;
import com.vn.ecommerce_backend.repository.RoleRepository;
import com.vn.ecommerce_backend.repository.UserHasRoleRepository;
import com.vn.ecommerce_backend.repository.UserRepository;
import com.vn.ecommerce_backend.service.EmailService;
import com.vn.ecommerce_backend.service.UserService;
import com.vn.ecommerce_backend.specification.UserSpecification;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@Slf4j(topic = "User-Service")
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final RoleRepository roleRepository;
    private final UserHasRoleRepository userHasRoleRepository;

    public UserServiceImpl(UserRepository userRepository, PasswordEncoder passwordEncoder, EmailService emailService, RoleRepository roleRepository, UserHasRoleRepository userHasRoleRepository) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
        this.roleRepository = roleRepository;
        this.userHasRoleRepository = userHasRoleRepository;
    }

    @Override
    public PageResponse<UserResponse> getUsers(UserFilter userFilter, Pageable pageable) {
        if (pageable.getSort().isUnsorted()){
            pageable = PageRequest.of(
                    pageable.getPageNumber(),
                    pageable.getPageSize(),
                    Sort.by(Sort.Direction.DESC, "createdAt")
            );
        }

        Specification<User> spec = UserSpecification.withFilter(userFilter);

        Page<UserResponse> userList = userRepository.findAll(spec, pageable).map(
                 this::mapToUserResponse);

        return convertToPageResponse(userList);
    }

    @Override
    public UserDetailResponse getCurrentUser() {

        Authentication authentication = SecurityContextHolder
                .getContext()
                .getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }

        if (authentication.getPrincipal() instanceof CustomUserDetails customUser) {
            return mapToUserDetailResponse(customUser);
        }

        log.warn("JWT principal is not CustomUserDetails, falling back to database for user: {}",
                authentication.getName());

        User user = userRepository.findUserWithRolesAndPermissionsByUsername(authentication.getName())
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        return mapToUserDetailResponse(user);
    }

    @Override
    public UserDetailResponse getUserDetail(Long id) {
        User user = userRepository.findUserWithRolesAndPermissions(id)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        return mapToUserDetailResponse(user);
    }

    @Override
    @Transactional(rollbackFor = AppException.class)
    public UserResponse createUser(UserCreateRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            log.error("Email already exists");
            throw new AppException(ErrorCode.EMAIL_ALREADY_EXISTS);
        }

        if (userRepository.existsByUsername(request.getUsername())) {
            log.error("Username already exists");
            throw new AppException(ErrorCode.USER_ALREADY_EXISTS);
        }

        User user = new User();
        user.setFullName(request.getFullName());
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPhone(request.getPhone());
        user.setDateOfBirth(request.getDateOfBirth());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setActive(true);
        userRepository.save(user);

        UserHasRole userHasRole = new UserHasRole();
        userHasRole.setUser(user);
        userHasRole.setRole(roleRepository.findByName(request.getRole())
                .orElseThrow(() -> new AppException(ErrorCode.ROLE_NOT_FOUND)));
        userHasRole.setAssignedAt(LocalDateTime.now());
        userHasRole.setAssignedBy("Admin System");
        userHasRoleRepository.save(userHasRole);

        log.info("User created: " + user.getUsername());
        return mapToUserResponse(user);
    }

    @Override
    @Transactional(rollbackFor = AppException.class)
    public void updateUser(Long id, UserUpdateRequest request) {

        User user = userRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        if (!user.getEmail().equals(request.getEmail()) && userRepository.existsByEmail(request.getEmail())) {
            log.error("Email already exists");
            throw new AppException(ErrorCode.EMAIL_ALREADY_EXISTS);
        }

        user.setFullName(request.getFullName());
        user.setEmail(request.getEmail());
        user.setPhone(request.getPhone());
        user.setDateOfBirth(request.getDateOfBirth());
        user.setActive(request.isActive());
        userRepository.save(user);

        UserHasRole userHasRole = new UserHasRole();
        userHasRole.setUser(user);
        userHasRole.setRole(roleRepository.findByName(request.getRole())
                .orElseThrow(() -> new AppException(ErrorCode.ROLE_NOT_FOUND)));
        userHasRole.setAssignedAt(LocalDateTime.now());
        userHasRole.setAssignedBy("Admin System");
        userHasRoleRepository.save(userHasRole);
        log.info("User updated: " + user.getUsername());
    }

    @Override
    public void deleteUser(Long id) {
        log.info("Deleting user: " + id);
        userRepository.deleteById(id);
    }

    @Override
    @Transactional(rollbackFor = AppException.class)
    public void updateProfile(Long id, ProfileUpdateRequest request) {

        User user = userRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        user.setFullName(request.getFullName());
        user.setPhone(request.getPhone());
        user.setDateOfBirth(request.getDateOfBirth());
        userRepository.save(user);
        log.info("User profile updated: " + user.getUsername());
    }

    @Override
    @Transactional(rollbackFor = AppException.class)
    public void resetPassword(ResetPasswordRequest request) {

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        String passwordNew = "Ecommerce@14";
        user.setPassword(passwordEncoder.encode(passwordNew));
        userRepository.save(user);

        emailService.sendPasswordResetEmail(user.getEmail(), user.getFullName(),passwordNew);
    }

    @Override
    @Transactional(rollbackFor = AppException.class)
    public void changePassword(Long id, ChangePasswordRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        if (!passwordEncoder.matches(request.getOldPassword(), user.getPassword())) {
            log.error("Old password is incorrect");
            throw new AppException(ErrorCode.PASSWORD_NOT_CORRECT);
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
        log.info("User password changed: " + user.getUsername());
    }

    private UserResponse mapToUserResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .phone(user.getPhone())
                .build();
    }

    private UserDetailResponse mapToUserDetailResponse(User user) {
        return UserDetailResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .phone(user.getPhone())
                .dateOfBirth(user.getDateOfBirth())
                .isActive(user.isActive())
                .isEmailVerified(user.isEmailVerified())
                .createdAt(user.getCreatedAt())
                .roles(user.getRoleList())
                .permissions(getPermissionsFromUser(user))
                .build();
    }

    private List<String> getPermissionsFromUser(User user) {
        return user.getRoles().stream()
                .map(UserHasRole::getRole)
                .flatMap(Role -> Role.getPermissions().stream())
                .map(rhp -> rhp.getPermission().getName())
                .distinct()
                .toList();
    }

    private UserDetailResponse mapToUserDetailResponse(CustomUserDetails userDetails) {
        return UserDetailResponse.builder()
                .id(userDetails.getId())
                .username(userDetails.getUsername())
                .email(userDetails.getEmail())
                .fullName(userDetails.getFullName())
                .roles(userDetails.getRoles())
                .permissions(userDetails.getPermissions())
                .build();
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
