package com.vn.ecommerce_backend.service;

import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Component
@Slf4j(topic = "OrderCodeGenerator")
public class OrderCodeGenerator {

    private final StringRedisTemplate redisTemplate;

    private static final String ORDER_PREFIX = "ORD";
    private static final String ORDER_COUNTER_KEY = "order:code:counter";


    public OrderCodeGenerator(StringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    @PostConstruct
    public void init() {
        Boolean exists = redisTemplate.hasKey(ORDER_COUNTER_KEY);

        if (Boolean.FALSE.equals(exists)) {
            redisTemplate.opsForValue().set(ORDER_COUNTER_KEY, "100000");
            log.info("Initialized order code counter in Redis");
        }
    }

    public String generateOrderCode() {
        Long counter = redisTemplate.opsForValue().increment(ORDER_COUNTER_KEY);

        String datePart = LocalDate.now().format(DateTimeFormatter.ofPattern("ddMMyyyy"));

        return String.format("%s-%s-%08d", ORDER_PREFIX, datePart, counter);
    }
}
