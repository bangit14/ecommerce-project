package com.vn.ecommerce_backend.dto.request;

import java.util.List;

public class CreateOrderRequest {

    private List<SelectedCartItem> selectedItems;

    private Long addressId;

    private String note;

    private String couponCode;

    private String paymentMethod;

    public List<SelectedCartItem> getSelectedItems() {
        return selectedItems;
    }

    public void setSelectedItems(List<SelectedCartItem> selectedItems) {
        this.selectedItems = selectedItems;
    }

    public Long getAddressId() {
        return addressId;
    }

    public void setAddressId(Long addressId) {
        this.addressId = addressId;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }

    public String getCouponCode() {
        return couponCode;
    }

    public void setCouponCode(String couponCode) {
        this.couponCode = couponCode;
    }

    public String getPaymentMethod() {
        return paymentMethod;
    }

    public void setPaymentMethod(String paymentMethod) {
        this.paymentMethod = paymentMethod;
    }
}
