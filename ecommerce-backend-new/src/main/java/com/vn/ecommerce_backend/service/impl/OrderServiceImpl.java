package com.vn.ecommerce_backend.service.impl;

import com.vn.ecommerce_backend.common.constant.order.OrderStatus;
import com.vn.ecommerce_backend.common.util.JsonUtil;
import com.vn.ecommerce_backend.dto.request.CreateOrderRequest;
import com.vn.ecommerce_backend.dto.request.OrderFilter;
import com.vn.ecommerce_backend.dto.request.SelectedCartItem;
import com.vn.ecommerce_backend.dto.response.OrderHistoryResponse;
import com.vn.ecommerce_backend.dto.response.OrderItemResponse;
import com.vn.ecommerce_backend.dto.response.OrderResponse;
import com.vn.ecommerce_backend.dto.response.PageResponse;
import com.vn.ecommerce_backend.entity.*;
import com.vn.ecommerce_backend.exception.AppException;
import com.vn.ecommerce_backend.exception.ErrorCode;
import com.vn.ecommerce_backend.repository.*;
import com.vn.ecommerce_backend.service.*;
import com.vn.ecommerce_backend.specification.OrderSpecification;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Slf4j(topic = "Order-Service")
public class OrderServiceImpl implements OrderService {

    private final UserRepository userRepository;
    private final ProductVariantRepository productVariantRepository;
    private final OrderRepository orderRepository;
    private final OrderHistoryRepository orderHistoryRepository;
    private final AddressRepository addressRepository;

    private final CartService cartService;
    private final InventoryService inventoryService;
    private final KafkaTemplate<String, Object> kafkaTemplate;

    private final OrderCodeGenerator orderCodeGenerator;

    public OrderServiceImpl(UserRepository userRepository, ProductVariantRepository productVariantRepository, OrderRepository orderRepository, OrderHistoryRepository orderHistoryRepository, AddressRepository addressRepository, CartService cartService, InventoryService inventoryService, KafkaTemplate<String, Object> kafkaTemplate, OrderCodeGenerator orderCodeGenerator) {
        this.userRepository = userRepository;
        this.productVariantRepository = productVariantRepository;
        this.orderRepository = orderRepository;
        this.orderHistoryRepository = orderHistoryRepository;
        this.addressRepository = addressRepository;
        this.cartService = cartService;
        this.inventoryService = inventoryService;
        this.kafkaTemplate = kafkaTemplate;
        this.orderCodeGenerator = orderCodeGenerator;
    }


    @Override
    public PageResponse<OrderResponse> getMyOrders(Long userId, Pageable pageable) {

        Page<OrderResponse> orderPage = orderRepository.findByUserId(userId, pageable)
                .map(order -> {
                            List<OrderHistory> orderHistories = orderHistoryRepository.findByOrderId(order.getId());
                            return mapToOrderResponse(order, orderHistories);
                        }
                );

        return convertToPageResponse(orderPage);
    }

    @Override
    public OrderResponse getMyOrderDetails(Long userId, Long orderId) {

        Order order = orderRepository.findOrderWithItems(orderId,userId)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));

        List<OrderHistory> orderHistories = orderHistoryRepository.findByOrderId(orderId);

        return mapToOrderResponse(order, orderHistories);
    }

    @Override
    @Transactional(rollbackFor = AppException.class)
    public OrderResponse createOrder(Long userId, CreateOrderRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        if (request.getSelectedItems() == null || request.getSelectedItems().isEmpty()) {
            throw new AppException(ErrorCode.CART_EMPTY);
        }

        Cart cart = cartService.getCartDomain(userId);

        if (cart.getItems().isEmpty()) {
            throw new AppException(ErrorCode.CART_EMPTY);
        }

        List<CartItem> selectedCartItems = filterAndMergeSelectedItems(cart.getItems(), request.getSelectedItems());

        Order order = buildOrder(user, selectedCartItems, request);

        for (CartItem cartItem : selectedCartItems) {
            inventoryService.reserveStock(cartItem.getVariantId(), cartItem.getQuantity());
        }

        Order saveOrder = orderRepository.save(order);

        removeSelectedItemsFromCart(userId, request.getSelectedItems());



        log.debug("Order {} created for user {}", saveOrder.getId(), userId);

        return mapToOrderResponse(saveOrder, List.of());
    }

    @Override
    public void cancelOrder(Long userId, Long orderId, String reason) {

    }

    @Override
    public PageResponse<OrderResponse> getAllOrders(OrderFilter filter, Pageable pageable) {
        if (pageable.getSort().isUnsorted()){
            pageable = PageRequest.of(
                    pageable.getPageNumber(),
                    pageable.getPageSize(),
                    Sort.by(filter.getSortBy().equals("asc") ? Sort.Direction.ASC : Sort.Direction.DESC,
                            filter.getSortDir())
            );
        }

        Specification<Order> spec = OrderSpecification.withFilter(filter);

        Page<OrderResponse> orderList = orderRepository.findAll(spec, pageable)
                .map(order -> {
                    List<OrderHistory> orderHistories = orderHistoryRepository.findByOrderId(order.getId());
                    return mapToOrderResponse(order, orderHistories);
                });

        return convertToPageResponse(orderList);
    }

    @Override
    public OrderResponse getOrderDetails(Long orderId) {

        Order order = orderRepository.findOrderByUserId(orderId)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));

        List<OrderHistory> orderHistories = orderHistoryRepository.findByOrderId(orderId);

        return mapToOrderResponse(order, orderHistories);
    }

    @Override
    public void updateOrderStatus(Long orderId, String status) {

    }

    private List<CartItem> filterAndMergeSelectedItems(List<CartItem> cartItems, List<SelectedCartItem> selected) {
        Set<Long> selectedIds = selected.stream()
                .map(SelectedCartItem::getVariantId)
                .collect(Collectors.toSet());

        return cartItems.stream()
                .filter(item -> selectedIds.contains(item.getVariantId()))
                .toList();
    }

    private Order buildOrder(User user, List<CartItem> cartItems, CreateOrderRequest request) {
        Order order = new Order();
        order.setUser(user);
        order.setOrderCode(orderCodeGenerator.generateOrderCode());
        order.setStatus(OrderStatus.PENDING);
        order.setNote(request.getNote());

        BigDecimal totalAmount = BigDecimal.ZERO;

        for (CartItem cartItem : cartItems) {
            ProductVariant variant = productVariantRepository.findByVariantId(cartItem.getVariantId())
                    .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_VARIANT_NOT_FOUND));

            BigDecimal subtotal = variant.getPrice().multiply(BigDecimal.valueOf(cartItem.getQuantity()));

            OrderItem orderItem = new OrderItem();
            orderItem.setOrder(order);
            orderItem.setProduct(variant.getProduct());
            orderItem.setVariant(variant);
            orderItem.setSku(variant.getSku());
            orderItem.setProductName(variant.getProduct().getName());
            orderItem.setVariantAttributes(variant.getAttributes().asText());
            orderItem.setQuantity(cartItem.getQuantity());
            orderItem.setUnitPrice(variant.getPrice());
            orderItem.setSubtotal(subtotal);

            order.getItems().add(orderItem);
            totalAmount = totalAmount.add(orderItem.getSubtotal());
        }

        Address shippingAddress = getShippingAddress(user,request.getAddressId());
        order.setShippingAddress(JsonUtil.toJson(shippingAddress));

        order.setTotalAmount(totalAmount);

        if (order.getShippingFee() != null) {
            totalAmount = totalAmount.add(order.getShippingFee());
        }

        if (order.getDiscountAmount() != null) {
            totalAmount = totalAmount.subtract(order.getDiscountAmount());
        }

        order.setFinalAmount(totalAmount);

        return order;
    }

    private void removeSelectedItemsFromCart(Long userId, List<SelectedCartItem> selected) {
        Set<Long> variantIds = selected.stream()
                .map(SelectedCartItem::getVariantId)
                .collect(Collectors.toSet());
        cartService.removeItems(userId, variantIds);
    }

    private Address getShippingAddress(User user, Long addressId) {
        if (addressId != null) {
            return addressRepository.findByIdAndUserId(addressId, user.getId())
                    .orElseThrow(() -> new AppException(ErrorCode.ADDRESS_NOT_FOUND));
        }

        return addressRepository.findDefaultAddressByUserId(user.getId())
                .orElseThrow(() -> new AppException(ErrorCode.ADDRESS_NOT_FOUND));
    }


    private OrderResponse mapToOrderResponse(Order order, List<OrderHistory> orderHistories) {
        return OrderResponse.builder()
                .id(order.getId())
                .orderCode(order.getOrderCode())
                .userId(order.getUser().getId())
                .customerName(order.getUser().getFullName())
                .status(order.getStatus())
                .paymentStatus(order.getPaymentStatus())
                .totalAmount(order.getTotalAmount())
                .discountAmount(order.getDiscountAmount())
                .shippingFee(order.getShippingFee())
                .finalAmount(order.getFinalAmount())
                .shippingAddress(order.getShippingAddress())
                .note(order.getNote())
                .items(mapToOrderItemResponse(order.getItems()))
                .histories(mapToOrderHistoryResponse(orderHistories))
                .build();
    }

    private List<OrderItemResponse> mapToOrderItemResponse(List<OrderItem> orderItems) {
        return orderItems.stream()
                .map(item -> OrderItemResponse.builder()
                        .productId(item.getProduct().getId())
                        .productName(item.getProduct().getName())
                        .sku(item.getSku())
                        .variantAttributes(item.getVariantAttributes())
                        .quantity(item.getQuantity())
                        .unitPrice(item.getUnitPrice())
                        .subTotal(item.getSubtotal())
                        .build())
                .toList();
    }

    private List<OrderHistoryResponse> mapToOrderHistoryResponse(List<OrderHistory> orderHistories) {
        return orderHistories.stream()
                .map(history -> OrderHistoryResponse.builder()
                        .status(history.getStatus())
                        .note(history.getNote())
                        .createdAt(history.getCreatedAt())
                        .createdBy(history.getCreatedBy())
                        .build())
                .toList();
    }

    public static <T> PageResponse<T> convertToPageResponse(Page<T> page) {
        return PageResponse.<T>builder()
                .content(page.getContent())
                .pageNumber(page.getNumber())
                .pageSize(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .last(page.isLast())
                .first(page.isFirst())
                .empty(page.isEmpty())
                .build();
    }
}
