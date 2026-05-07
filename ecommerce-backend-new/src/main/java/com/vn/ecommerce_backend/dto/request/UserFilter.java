package com.vn.ecommerce_backend.dto.request;

import java.time.LocalDate;

public class UserFilter {
    private String username;
    private String email;
    private Boolean active;
    private String roleName;
    private LocalDate createdFrom;
    private LocalDate createdTo;

    public String getUsername() {
        return username;
    }

    public String getEmail() {
        return email;
    }

    public Boolean getActive() {
        return active;
    }

    public String getRoleName() {
        return roleName;
    }

    public LocalDate getCreatedFrom() {
        return createdFrom;
    }

    public LocalDate getCreatedTo() {
        return createdTo;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public void setActive(Boolean active) {
        this.active = active;
    }

    public void setRoleName(String roleName) {
        this.roleName = roleName;
    }

    public void setCreatedFrom(LocalDate createdFrom) {
        this.createdFrom = createdFrom;
    }

    public void setCreatedTo(LocalDate createdTo) {
        this.createdTo = createdTo;
    }
}
