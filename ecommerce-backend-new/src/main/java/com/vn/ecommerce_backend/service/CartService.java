package com.vn.ecommerce_backend.service;

import com.vn.ecommerce_backend.dto.request.AddCartItemRequest;
import com.vn.ecommerce_backend.dto.request.UpdateCartItemRequest;
import com.vn.ecommerce_backend.dto.response.CartResponse;
import com.vn.ecommerce_backend.entity.Cart;
import java.util.Set;

public interface CartService {

    CartResponse getCart(Long userId);

    Cart getCartDomain(Long userId);

    void addItem(Long userId, AddCartItemRequest request);

    void updateQuantity(Long userId, UpdateCartItemRequest request);

    void removeItem(Long userId, Long variantId);

    void removeItems(Long userId, Set<Long> variantIds);

    void clearCart(Long userId);

    int countItems(Long userId);

    boolean existsItem(Long userId, Long variantId);
}
