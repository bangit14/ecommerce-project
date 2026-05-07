package com.vn.ecommerce_backend.config.redis;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.vn.ecommerce_backend.common.constant.cache.CacheConstants;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.Jackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;
import org.springframework.data.redis.serializer.StringRedisSerializer;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

@Configuration
@EnableCaching
public class RedisConfig {

    @Bean
    public RedisTemplate<String, String> redisTemplate(RedisConnectionFactory factory) {
        RedisTemplate<String, String> template = new RedisTemplate<>();
        template.setConnectionFactory(factory);
        template.setKeySerializer(new StringRedisSerializer());
        template.setValueSerializer(new StringRedisSerializer());
        template.setHashKeySerializer(new StringRedisSerializer());
        template.setHashValueSerializer(new StringRedisSerializer());
        template.afterPropertiesSet();
        return template;
    }

    @Bean
    public StringRedisTemplate stringRedisTemplate(RedisConnectionFactory factory) {
        return new StringRedisTemplate(factory);
    }

    @Bean(name = "jsonRedisTemplate")
    public RedisTemplate<String, Object> jsonRedisTemplate(RedisConnectionFactory factory) {
        RedisTemplate<String, Object> template = new RedisTemplate<>();
        template.setConnectionFactory(factory);

        template.setKeySerializer(new StringRedisSerializer());
        template.setHashKeySerializer(new StringRedisSerializer());

        ObjectMapper objectMapper = new ObjectMapper();

        objectMapper.registerModule(new JavaTimeModule());

        objectMapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);

        objectMapper.configure(SerializationFeature.FAIL_ON_EMPTY_BEANS, false);

        objectMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

        // Tùy chọn: Pretty print khi debug (có thể bỏ ở production)
        // objectMapper.enable(SerializationFeature.INDENT_OUTPUT);

        Jackson2JsonRedisSerializer<Object> serializer =
                new Jackson2JsonRedisSerializer<>(objectMapper, Object.class);

        template.setValueSerializer(serializer);
        template.setHashValueSerializer(serializer);

        template.afterPropertiesSet();
        return template;
    }

    /**
     * ObjectMapper riêng cho Cache - KHÔNG dùng chung với Spring MVC.
     *
     * Lý do cần ObjectMapper riêng:
     * - activateDefaultTyping() ghi type info vào JSON ("@class": "com.vn...CategoryResponse")
     * - Nếu bật trên ObjectMapper chung → response API sẽ bị lẫn "@class" field → xấu
     * - Tách ra để cache serialize/deserialize đúng type, API response vẫn sạch
     */
    @Bean("cacheObjectMapper")
    public ObjectMapper cacheObjectMapper() {
        ObjectMapper mapper = new ObjectMapper();

        // Hỗ trợ LocalDateTime, LocalDate, ...
        mapper.registerModule(new JavaTimeModule());
        mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

        return mapper;
    }

    /**
     * Serializer dùng riêng cho CacheManager.
     * Dùng cacheObjectMapper ở trên, KHÔNG phải bean jsonRedisTemplate serializer.
     */
    @Bean("cacheRedisSerializer")
    public GenericJackson2JsonRedisSerializer cacheRedisSerializer() {
        return new GenericJackson2JsonRedisSerializer(cacheObjectMapper());
    }

    /**
     * Default config áp dụng cho mọi cache nếu không có config riêng.
     * - TTL: 30 phút
     * - Key prefix: tên cache name, ví dụ "category:tree::all"
     * - Không cache giá trị null (tránh cache kết quả lỗi)
     */
    private RedisCacheConfiguration defaultCacheConfig() {
        return RedisCacheConfiguration.defaultCacheConfig()
                .entryTtl(Duration.ofMinutes(30))
                .disableCachingNullValues()
                .prefixCacheNameWith("ecommerce:")
                .serializeKeysWith(
                        RedisSerializationContext.SerializationPair
                                .fromSerializer(new StringRedisSerializer())
                )
                .serializeValuesWith(
                        RedisSerializationContext.SerializationPair
                                .fromSerializer(cacheRedisSerializer())
                );
    }


    @Bean
    public CacheManager cacheManager(RedisConnectionFactory connectionFactory) {
        Map<String, RedisCacheConfiguration> cacheConfigs = new HashMap<>();

        cacheConfigs.put(CacheConstants.CATEGORY_TREE,
                defaultCacheConfig().entryTtl(Duration.ofHours(2)));

        cacheConfigs.put(CacheConstants.CATEGORY_ROOT,
                defaultCacheConfig().entryTtl(Duration.ofHours(2)));

        cacheConfigs.put(CacheConstants.CATEGORY_CHILDREN,
                defaultCacheConfig().entryTtl(Duration.ofHours(1)));

        cacheConfigs.put(CacheConstants.CATEGORY_DESCENDANT_IDS,
                defaultCacheConfig().entryTtl(Duration.ofHours(1)));

        cacheConfigs.put(CacheConstants.CATEGORY_ALL_ACTIVE,
                defaultCacheConfig().entryTtl(Duration.ofMinutes(30)));

        return RedisCacheManager.builder(connectionFactory)
                .cacheDefaults(defaultCacheConfig())
                .withInitialCacheConfigurations(cacheConfigs)
                .build();
    }
}
