package com.vn.ecommerce_backend.service.impl;

import com.vn.ecommerce_backend.dto.request.AddressCreateRequest;
import com.vn.ecommerce_backend.dto.request.AddressUpdateRequest;
import com.vn.ecommerce_backend.dto.response.AddressResponse;
import com.vn.ecommerce_backend.entity.Address;
import com.vn.ecommerce_backend.entity.User;
import com.vn.ecommerce_backend.exception.AppException;
import com.vn.ecommerce_backend.exception.ErrorCode;
import com.vn.ecommerce_backend.repository.AddressRepository;
import com.vn.ecommerce_backend.repository.UserRepository;
import com.vn.ecommerce_backend.service.AddressService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Slf4j(topic = "Address-Service")
public class AddressServiceImpl implements AddressService {

    private final AddressRepository addressRepository;
    private final UserRepository userRepository;

    public AddressServiceImpl(AddressRepository addressRepository, UserRepository userRepository) {
        this.addressRepository = addressRepository;
        this.userRepository = userRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<AddressResponse> getAllAddressesByUserId(Long userId) {

        List<Address> addresses = addressRepository.findByUserIdOrderByIsDefaultDescCreatedAtAsc(userId);

        return addresses.stream().map(
                address -> AddressResponse.builder()
                        .id(address.getId())
                        .fullName(address.getFullName())
                        .phone(address.getPhone())
                        .addressLine(address.getAddressLine())
                        .ward(address.getWard())
                        .district(address.getDistrict())
                        .province(address.getProvince())
                        .country(address.getCountry())
                        .isDefault(address.isDefault())
                        .isShipping(address.isShipping())
                        .isBilling(address.isBilling())
                        .build()
        ).toList();
    }

    @Override
    @Transactional(rollbackFor = AppException.class)
    public AddressResponse addAddress(Long userId, AddressCreateRequest request) {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        Address newAddress = new Address();
        newAddress.setFullName(request.getFullName());
        newAddress.setPhone(request.getPhone());
        newAddress.setAddressLine(request.getAddressLine());
        newAddress.setWard(request.getWard());
        newAddress.setDistrict(request.getDistrict());
        newAddress.setProvince(request.getProvince());
        newAddress.setCountry(request.getCountry());
        newAddress.setUser(user);
        addressRepository.save(newAddress);

        log.debug("Address created: {}", newAddress);

        if (Boolean.TRUE.equals(request.isDefault())) {
            addressRepository.resetAllDefaultAddresses(userId);
            newAddress.setDefault(true);
        }

        addressRepository.save(newAddress);

        return AddressResponse.builder()
                .id(newAddress.getId())
                .fullName(newAddress.getFullName())
                .phone(newAddress.getPhone())
                .addressLine(newAddress.getAddressLine())
                .ward(newAddress.getWard())
                .district(newAddress.getDistrict())
                .province(newAddress.getProvince())
                .country(newAddress.getCountry())
                .isDefault(newAddress.isDefault())
                .isShipping(newAddress.isShipping())
                .isBilling(newAddress.isBilling())
                .build();
    }

    @Override
    @Transactional(rollbackFor = AppException.class)
    public void updateAddress(Long id, Long userId, AddressUpdateRequest request) {

        Address addressToUpdate = addressRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.ADDRESS_NOT_FOUND));

        addressToUpdate.setFullName(request.getFullName());
        addressToUpdate.setPhone(request.getPhone());
        addressToUpdate.setAddressLine(request.getAddressLine());
        addressToUpdate.setWard(request.getWard());
        addressToUpdate.setDistrict(request.getDistrict());
        addressToUpdate.setProvince(request.getProvince());
        addressToUpdate.setCountry(request.getCountry());

        if (Boolean.TRUE.equals(request.isDefault()) && !addressToUpdate.isDefault()) {
            addressRepository.resetAllDefaultAddresses(userId);
            addressToUpdate.setDefault(true);
        }

        addressRepository.save(addressToUpdate);

        log.debug("Address updated: {}", addressToUpdate);
    }

    @Override
    @Transactional(rollbackFor = AppException.class)
    public void deleteAddress(Long userId, Long addressId) {

        Address addressToDelete = addressRepository.findByIdAndUserId(addressId, userId)
                .orElseThrow(() -> new AppException(ErrorCode.ADDRESS_NOT_FOUND));

        if (addressToDelete.isDefault()){
            addressRepository.findFirstByUserIdAndIsDefaultFalseOrderByCreatedAtDesc(userId)
                    .ifPresent(nextDefault -> {
                        nextDefault.setDefault(true);
                        addressRepository.save(nextDefault);
                    });
        }
        addressRepository.delete(addressToDelete);
        log.debug("Address deleted: {}", addressToDelete);
    }

    @Override
    public void setDefaultAddress(Long userId, Long addressId) {

        Address addresses = addressRepository.findByIdAndUserId(addressId, userId)
                .orElseThrow(() -> new AppException(ErrorCode.ADDRESS_NOT_FOUND));

        addressRepository.resetAllDefaultAddresses(userId);

        addresses.setDefault(true);
        addressRepository.save(addresses);
        log.debug("Default address set: {}", addressId);
    }
}
