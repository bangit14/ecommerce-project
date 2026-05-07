package com.vn.ecommerce_backend.controller;

import com.vn.ecommerce_backend.dto.request.AddCartItemRequest;
import com.vn.ecommerce_backend.dto.request.UpdateCartItemRequest;
import com.vn.ecommerce_backend.entity.CartItem;
import com.vn.ecommerce_backend.service.CartService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/carts")
@Slf4j(topic = "Cart-Controller")
public class CartController {

    private final CartService cartService;

    public CartController(CartService cartService) {
        this.cartService = cartService;
    }

    @GetMapping("/items")
    public ResponseEntity<List<CartItem>> getCartItems(@RequestParam Long userId) {
        List<CartItem> cartItems = cartService.getCartItems(userId);
        return ResponseEntity.ok(cartItems);
    }

    @PostMapping("/add")
    public ResponseEntity<Void> addToCart(@RequestParam Long userId, @RequestBody AddCartItemRequest request) {
        cartService.addItem(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @PutMapping("/update")
    public ResponseEntity<Void> updateCartItem(@RequestParam Long userId, @RequestBody UpdateCartItemRequest request) {
        cartService.updateQuantity(userId, request);
        return ResponseEntity.status(HttpStatus.ACCEPTED).build();
    }

    @DeleteMapping("/remove")
    public ResponseEntity<Void> removeCartItem(@RequestParam Long userId, @RequestParam Long variantId) {
            cartService.removeItem(userId, variantId);
            return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
    }

    @DeleteMapping("/clear")
    public ResponseEntity<Void> clearCart(@RequestParam Long userId) {
        cartService.clearCart(userId);
        return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
    }

    @GetMapping("/count")
    public ResponseEntity<Integer> getCartItemCount(@RequestParam Long userId) {
        return ResponseEntity.ok(cartService.countItems(userId));
    }
}
