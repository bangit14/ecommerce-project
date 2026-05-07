package com.vn.ecommerce_backend.controller;

import com.vn.ecommerce_backend.dto.request.AddressCreateRequest;
import com.vn.ecommerce_backend.dto.request.AddressUpdateRequest;
import com.vn.ecommerce_backend.dto.response.AddressResponse;
import com.vn.ecommerce_backend.dto.response.UserDetailResponse;
import com.vn.ecommerce_backend.service.AddressService;
import com.vn.ecommerce_backend.service.UserService;
import lombok.extern.slf4j.Slf4j;
import org.apache.catalina.security.SecurityUtil;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/addresses")
@Slf4j(topic = "Address-Controller")
public class AddressController {

    private final AddressService addressService;
    private final UserService userService;

    public AddressController(AddressService addressService, UserService userService) {
        this.addressService = addressService;
        this.userService = userService;
    }

    @GetMapping("/list")
    public ResponseEntity<List<AddressResponse>> getAllAddresses() {
        UserDetailResponse currentUser = userService.getCurrentUser();
        List<AddressResponse> addresses = addressService.getAllAddressesByUserId(currentUser.getId());
        return ResponseEntity.ok(addresses);
    }

    @PutMapping("/{addressId}/default")
    public ResponseEntity<Void> setDefaultAddress(@PathVariable Long addressId) {
        UserDetailResponse currentUser = userService.getCurrentUser();
        addressService.setDefaultAddress(currentUser.getId(), addressId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/add")
    public ResponseEntity<Void> addAddress(@RequestBody AddressCreateRequest request) {
        UserDetailResponse currentUser = userService.getCurrentUser();
        addressService.addAddress(currentUser.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @PutMapping("/update/{addressId}")
    public ResponseEntity<Void> updateAddress(@PathVariable Long addressId, @RequestBody AddressUpdateRequest request) {
        UserDetailResponse currentUser = userService.getCurrentUser();
        addressService.updateAddress(currentUser.getId(), addressId, request);
        return ResponseEntity.status(HttpStatus.ACCEPTED).build();
    }

    @DeleteMapping("/delete/{addressId}")
    public ResponseEntity<Void> deleteAddress(@PathVariable Long addressId) {
        UserDetailResponse currentUser = userService.getCurrentUser();
        addressService.deleteAddress(currentUser.getId(), addressId);
        return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
    }
}
