package com.vn.ecommerce_backend.service.impl;

import com.vn.ecommerce_backend.dto.request.AddCartItemRequest;
import com.vn.ecommerce_backend.dto.request.UpdateCartItemRequest;
import com.vn.ecommerce_backend.dto.response.CartResponse;
import com.vn.ecommerce_backend.entity.Cart;
import com.vn.ecommerce_backend.entity.CartItem;
import com.vn.ecommerce_backend.service.CartService;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.HashOperations;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@Slf4j(topic = "Cart-Service")
public class CartServiceImpl implements CartService {

    private final RedisTemplate<String, Object> redisTemplate;

    private HashOperations<String,String,CartItem> hashOps;

    private static final String USER_CART_KEY_PREFIX = "cart:user:";
    private static final long CART_TTL_DAYS = 7;

    @PostConstruct
    private void init() {
        this.hashOps = redisTemplate.opsForHash();
    }

    private String getCartKey(Long userId) {
        return USER_CART_KEY_PREFIX + userId;
    }

    private void setCartTTL(String cartKey) {
        redisTemplate.expire(cartKey, CART_TTL_DAYS, java.util.concurrent.TimeUnit.DAYS);
    }

    public CartServiceImpl(RedisTemplate<String, Object> redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    @Override
    public CartResponse getCart(Long userId) {
        List<CartItem> items = getCartItemInternal(userId);

        return CartResponse.builder()
                .userId(userId)
                .items(items)
                .totalAmount(items.stream().map(CartItem::getSubtotal)
                        .reduce(BigDecimal.ZERO, BigDecimal::add))
                .totalQuantity(items.stream().mapToInt(CartItem::getQuantity).sum())
                .itemCount(items.size())
                .lastUpdated(LocalDateTime.now())
                .build();
    }

    @Override
    public Cart getCartDomain(Long userId) {
        List<CartItem> items = getCartItemInternal(userId);
        return Cart.builder()
                .userId(userId)
                .items(items)
                .lastUpdated(LocalDateTime.now())
                .build();
    }

    @Override
    public void addItem(Long userId, AddCartItemRequest request) {

        if (request.getVariantId() == null || request.getQuantity() == null || request.getQuantity() <= 0) {
            log.warn("Invalid variant id or quantity");
            return;
        }

        String cartKey = getCartKey(userId);
        String field = request.getVariantId().toString();

        CartItem existingItem = hashOps.get(cartKey, field);

        if (existingItem != null) {
            existingItem.setQuantity(existingItem.getQuantity() + request.getQuantity());
            existingItem.setUpdatedAt(LocalDateTime.now());
            hashOps.put(cartKey, field, existingItem);
            log.debug("Updated quantity for variant {} in user {}'s cart to {}", field, userId, existingItem.getQuantity());
        } else {
            CartItem cartItem = convertToCartItem(request);
            hashOps.put(cartKey, field, cartItem);
            log.debug("Added variant {} to user {}'s cart with quantity {}", field, userId, cartItem.getQuantity());
        }
        setCartTTL(cartKey);
    }

    @Override
    public void updateQuantity(Long userId, UpdateCartItemRequest request) {

        if (request.getVariantId() == null) {
            log.warn("Variant id is null");
            return;
        }

        String cartKey = getCartKey(userId);
        String field = request.getVariantId().toString();

        CartItem existingItem = hashOps.get(cartKey, field);
        if (existingItem == null) {
            log.warn("Variant {} not found in user {}'s cart", field, userId);
            return;
        }

        if (request.getQuantity() == null || request.getQuantity() <= 0) {
            hashOps.delete(cartKey, field);
            log.debug("Removed variant {} from user {}'s cart due to non-positive quantity", field, userId);
        } else {
            existingItem.setQuantity(request.getQuantity());
            existingItem.setUpdatedAt(LocalDateTime.now());
            hashOps.put(cartKey, field, existingItem);
            log.debug("Updated quantity for variant {} in user {}'s cart to {}", field, userId, request.getQuantity());
        }
         setCartTTL(cartKey);
    }

    @Override
    public void removeItem(Long userId, Long variantId) {
        if (variantId == null) {
            log.warn("Variant id is null");
            return;
        }

        String cartKey = getCartKey(userId);
        String field = variantId.toString();
        hashOps.delete(cartKey, field);
        setCartTTL(cartKey);
        log.debug("Removed variant {} from user {}'s cart", field, userId);
    }

    @Override
    public void removeItems(Long userId, Set<Long> variantIds) {
        if (variantIds == null || variantIds.isEmpty()) {
            log.warn("Variant ids set is null or empty");
            return;
        }

        String cartKey = getCartKey(userId);
        String[] fields = variantIds.stream()
                .map(String::valueOf).toArray(String[]::new);
        hashOps.delete(cartKey, fields);
        setCartTTL(cartKey);
        log.debug("Removed variants {} from user {}'s cart", fields, userId);
    }

    @Override
    public void clearCart(Long userId) {
        String cartKey = getCartKey(userId);
        redisTemplate.delete(cartKey);
        log.debug("Cleared cart for user {}", userId);
    }

    @Override
    public int countItems(Long userId) {
        String cartKey = getCartKey(userId);
        Long size = hashOps.size(cartKey);
        return size != null ? size.intValue() : 0;
    }

    @Override
    public boolean existsItem(Long userId, Long variantId) {
        String cartKey = getCartKey(userId);
        return Boolean.TRUE.equals(hashOps.hasKey(cartKey, variantId.toString()));
    }

    private List<CartItem> getCartItemInternal(Long userId) {
        String cartKey = getCartKey(userId);
        Map<String, CartItem> entries = hashOps.entries(cartKey);
        return new ArrayList<>(entries.values());
    }

    private CartItem convertToCartItem(AddCartItemRequest request) {
        return CartItem.builder()
                .productId(request.getProductId())
                .variantId(request.getVariantId())
                .sku(request.getSku())
                .productName(request.getProductName())
                .variantAttributes(request.getVariantAttributes())
                .imageUrl(request.getImageUrl())
                .price(request.getPrice())
                .compareAtPrice(request.getCompareAtPrice())
                .quantity(request.getQuantity())
                .addedAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
    }
}
