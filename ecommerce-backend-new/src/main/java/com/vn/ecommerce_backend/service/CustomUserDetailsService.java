package com.vn.ecommerce_backend.service;

import com.vn.ecommerce_backend.common.constant.security.CustomUserDetails;
import com.vn.ecommerce_backend.entity.User;
import com.vn.ecommerce_backend.entity.UserHasRole;
import com.vn.ecommerce_backend.repository.UserRepository;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    public CustomUserDetailsService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        User user = userRepository.findUserWithRolesAndPermissionsByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User " + username + " not found"));

        if (!user.isActive()) {
            throw new UsernameNotFoundException("User " + username + " not found");
        }

        List<String> permissions = user.getRoles().stream()
                .map(UserHasRole::getRole)
                .flatMap(role -> role.getPermissions().stream())
                .map(rhp -> rhp.getPermission().getCode())
                .distinct()
                .toList();

        return CustomUserDetails.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .password(user.getPassword())
                .active(user.isActive())
                .roles(user.getRoleList())
                .permissions(permissions)
                .build();
    }
}
