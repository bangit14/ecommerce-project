package com.vn.ecommerce_backend.dto.response;

import lombok.Builder;

@Builder
public class AddressResponse {
    private Long id;
    private String fullName;
    private String phone;
    private String addressLine;
    private String ward; // Phường/Xã
    private String district; // Quận/Huyện
    private String province; // Tỉnh/Thành phố
    private String country;
    private boolean isDefault;
    private boolean isBilling;
    private boolean isShipping;

    public String getFullName() {
        return fullName;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public void setAddressLine(String addressLine) {
        this.addressLine = addressLine;
    }

    public void setWard(String ward) {
        this.ward = ward;
    }

    public void setDistrict(String district) {
        this.district = district;
    }

    public void setProvince(String province) {
        this.province = province;
    }

    public void setCountry(String country) {
        this.country = country;
    }

    public void setDefault(boolean aDefault) {
        isDefault = aDefault;
    }

    public void setBilling(boolean billing) {
        isBilling = billing;
    }

    public void setShipping(boolean shipping) {
        isShipping = shipping;
    }

    public String getPhone() {
        return phone;
    }

    public String getAddressLine() {
        return addressLine;
    }

    public String getWard() {
        return ward;
    }

    public String getDistrict() {
        return district;
    }

    public String getProvince() {
        return province;
    }

    public String getCountry() {
        return country;
    }

    public boolean isDefault() {
        return isDefault;
    }

    public boolean isBilling() {
        return isBilling;
    }

    public boolean isShipping() {
        return isShipping;
    }
}
