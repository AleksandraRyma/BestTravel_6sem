package com.delivry.backend.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.boot.autoconfigure.jackson.Jackson2ObjectMapperBuilderCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Без этого конфига Spring Boot сериализует LocalDate как массив [2026, 3, 9]
 * вместо строки "2026-03-09". Этот бин это исправляет.
 *
 * Также добавьте в pom.xml:
 *   <dependency>
 *     <groupId>com.fasterxml.jackson.datatype</groupId>
 *     <artifactId>jackson-datatype-jsr310</artifactId>
 *   </dependency>
 */
/*@Configuration
public class JacksonConfig {

    @Bean
    public ObjectMapper objectMapper() {
        ObjectMapper mapper = new ObjectMapper();
        // Регистрируем поддержку Java 8 Date/Time API
        mapper.registerModule(new JavaTimeModule());
        // ОТКЛЮЧАЕМ сериализацию дат как массивов — будут строки "yyyy-MM-dd"
        mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        return mapper;
    }
}*/


@Configuration
public class JacksonConfig {

    @Bean
    public Jackson2ObjectMapperBuilderCustomizer jacksonCustomizer() {
        return builder -> builder
                .modules(new JavaTimeModule())
                .featuresToDisable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
    }
}