package com.vn.ecommerce_backend.dto.request;

import java.time.LocalDate;

public class UserUpdateRequest {
    private String fullName;
    private String email;
    private String phone;
    private String role;
    private LocalDate dateOfBirth;
    private boolean isActive;

    public String getFullName() {
        return fullName;
    }

    public String getEmail() {
        return email;
    }

    public String getPhone() {
        return phone;
    }

    public String getRole() {
        return role;
    }

    public LocalDate getDateOfBirth() {
        return dateOfBirth;
    }

    public boolean isActive() {
        return isActive;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public void setDateOfBirth(LocalDate dateOfBirth) {
        this.dateOfBirth = dateOfBirth;
    }

    public void setActive(boolean active) {
        isActive = active;
    }
}
