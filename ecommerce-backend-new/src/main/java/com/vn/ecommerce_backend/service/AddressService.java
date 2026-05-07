package com.vn.ecommerce_backend.service;


import com.vn.ecommerce_backend.dto.request.AddressCreateRequest;
import com.vn.ecommerce_backend.dto.request.AddressUpdateRequest;
import com.vn.ecommerce_backend.dto.response.AddressResponse;

import java.util.List;

public interface AddressService {

    List<AddressResponse> getAllAddressesByUserId(Long userId);

    AddressResponse addAddress(Long userId, AddressCreateRequest request);

    void updateAddress(Long id, Long userId, AddressUpdateRequest request);

    void deleteAddress(Long userId ,Long id);

    void setDefaultAddress(Long userId, Long id);
}
