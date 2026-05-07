package com.vn.ecommerce_backend.service;

import com.vn.ecommerce_backend.entity.Role;
import com.vn.ecommerce_backend.repository.RoleRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Service;

@Service
public class RoleService {

    private final RoleRepository roleRepository;

    private Role defaultRole;

    public RoleService(RoleRepository roleRepository) {
        this.roleRepository = roleRepository;
    }

    @PostConstruct
    public void initDefaultRole() {
        defaultRole = roleRepository.findByName("USER")
                .orElseGet(() -> {
                    Role userRole = new Role();
                    userRole.setName("USER");
                    userRole.setDescription("Default role for regular users");
                    userRole.setSystem(true);
                    return roleRepository.save(userRole);
                });
    }

    public Role getDefaultRole() {
        return defaultRole;
    }

}
