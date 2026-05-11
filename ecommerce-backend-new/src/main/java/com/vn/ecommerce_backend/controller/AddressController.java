package com.vn.ecommerce_backend.controller;

import com.vn.ecommerce_backend.common.constant.security.SecurityUtils;
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

    public AddressController(AddressService addressService) {
        this.addressService = addressService;
    }

    @GetMapping("/list")
    public ResponseEntity<List<AddressResponse>> getAllAddresses() {
        List<AddressResponse> addresses = addressService.getAllAddressesByUserId(SecurityUtils.getCurrentUserId());
        return ResponseEntity.ok(addresses);
    }

    @PutMapping("/{addressId}/default")
    public ResponseEntity<Void> setDefaultAddress(@PathVariable Long addressId) {
        addressService.setDefaultAddress(SecurityUtils.getCurrentUserId(), addressId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/add")
    public ResponseEntity<Void> addAddress(@RequestBody AddressCreateRequest request) {
        addressService.addAddress(SecurityUtils.getCurrentUserId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @PutMapping("/update/{addressId}")
    public ResponseEntity<Void> updateAddress(@PathVariable Long addressId, @RequestBody AddressUpdateRequest request) {
        addressService.updateAddress(SecurityUtils.getCurrentUserId(), addressId, request);
        return ResponseEntity.status(HttpStatus.ACCEPTED).build();
    }

    @DeleteMapping("/delete/{addressId}")
    public ResponseEntity<Void> deleteAddress(@PathVariable Long addressId) {
        addressService.deleteAddress(SecurityUtils.getCurrentUserId(), addressId);
        return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
    }
}
