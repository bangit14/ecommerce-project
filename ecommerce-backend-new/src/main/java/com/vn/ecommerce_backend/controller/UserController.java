package com.vn.ecommerce_backend.controller;

import com.vn.ecommerce_backend.common.util.PageableUtils;
import com.vn.ecommerce_backend.dto.request.*;
import com.vn.ecommerce_backend.dto.response.PageResponse;
import com.vn.ecommerce_backend.dto.response.UserDetailResponse;
import com.vn.ecommerce_backend.dto.response.UserResponse;
import com.vn.ecommerce_backend.service.UserService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@Slf4j(topic = "User-Controller")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/list")
    public ResponseEntity<PageResponse<UserResponse>> getUsers(
            @ModelAttribute UserFilter filter,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size,
            @RequestParam(required = false) String sortBy,
            @RequestParam(required = false) String sortDir) {

        Pageable pageable = PageableUtils.createPageable(page, size, sortBy, sortDir);

        PageResponse<UserResponse> result = userService.getUsers(filter, pageable);

        return ResponseEntity.status(HttpStatus.OK).body(result);
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserDetailResponse> getUserDetail(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getUserDetail(id));
    }

    @GetMapping("/me/profile")
    public ResponseEntity<UserDetailResponse> getUserProfile() {

        UserDetailResponse userProfile = userService.getCurrentUser();
        log.info("Get user profile: {}", userProfile);

        return ResponseEntity.status(HttpStatus.OK).body(userProfile);
    }

    @PostMapping("/create")
    public ResponseEntity<UserResponse> createUser(@RequestBody UserCreateRequest request) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(userService.createUser(request));
    }

    @PutMapping("/update/{id}")
    public ResponseEntity<Void> updateUser(@PathVariable Long id, @RequestBody UserUpdateRequest request) {
        userService.updateUser(id, request);
        return ResponseEntity
                .status(HttpStatus.ACCEPTED).build();
    }

    @PutMapping("/update-profile/{id}")
    public ResponseEntity<Void> updateProfile(@PathVariable Long id, @RequestBody ProfileUpdateRequest request) {
        userService.updateProfile(id, request);
        return ResponseEntity
                .status(HttpStatus.ACCEPTED).build();
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity
                .status(HttpStatus.NO_CONTENT).build();
    }

    @PostMapping("/reset-password")
    public ResponseEntity<Void> resetPassword(@RequestBody ResetPasswordRequest request) {
        userService.resetPassword(request);
        return ResponseEntity
                .status(HttpStatus.ACCEPTED).build();
    }

    @PutMapping("/change-password/{id}")
    public ResponseEntity<Void> changePassword(@PathVariable Long id, @RequestBody ChangePasswordRequest request) {
        userService.changePassword(id, request);
        return ResponseEntity
                .status(HttpStatus.ACCEPTED).build();
    }

}
