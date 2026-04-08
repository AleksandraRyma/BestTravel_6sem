package com.delivry.backend.domain.repository;

import com.delivry.backend.domain.entity.FavoriteRoute;
import com.delivry.backend.domain.entity.FavoriteRouteId;
import com.delivry.backend.domain.entity.Route;
import com.delivry.backend.domain.entity.User;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.MySQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest(properties = "spring.data.jpa.repositories.bootstrap-mode=lazy")
@Testcontainers(disabledWithoutDocker = true)
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class FavoriteRouteRepositoryIT {

    @Container
    static MySQLContainer<?> mysql = new MySQLContainer<>("mysql:8.0.33")
            .withDatabaseName("travel_test")
            .withUsername("test")
            .withPassword("test");

    @DynamicPropertySource
    static void datasourceProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", mysql::getJdbcUrl);
        registry.add("spring.datasource.username", mysql::getUsername);
        registry.add("spring.datasource.password", mysql::getPassword);
        registry.add("spring.datasource.driver-class-name", mysql::getDriverClassName);
        registry.add("spring.jpa.hibernate.ddl-auto", () -> "create-drop");
        registry.add("spring.jpa.properties.hibernate.dialect", () -> "org.hibernate.dialect.MySQL8Dialect");
    }

    @Autowired
    private FavoriteRouteRepository favoriteRouteRepository;
    @Autowired
    private EntityManager entityManager;

    @Test
    void shouldFindFavoritesByUserAndCountThem() {
        User user = persistUser("traveler@test.com");
        Route route1 = persistRoute(user, "Route 1");
        Route route2 = persistRoute(user, "Route 2");

        entityManager.persist(FavoriteRoute.builder()
                .id(new FavoriteRouteId(user.getUserId(), route1.getRouteId()))
                .user(user)
                .route(route1)
                .createdAt(LocalDateTime.now())
                .build());
        entityManager.persist(FavoriteRoute.builder()
                .id(new FavoriteRouteId(user.getUserId(), route2.getRouteId()))
                .user(user)
                .route(route2)
                .createdAt(LocalDateTime.now())
                .build());
        entityManager.flush();

        List<FavoriteRoute> favorites = favoriteRouteRepository.findByUser_UserId(user.getUserId());

        assertThat(favorites).hasSize(2);
        assertThat(favoriteRouteRepository.countByUser_UserId(user.getUserId())).isEqualTo(2);
    }

    private User persistUser(String email) {
        User user = User.builder()
                .fullName("Traveler")
                .email(email)
                .passwordHash("hash")
                .createdAt(LocalDate.of(2026, 1, 1))
                .build();
        entityManager.persist(user);
        entityManager.flush();
        return user;
    }

    private Route persistRoute(User creator, String title) {
        Route route = Route.builder()
                .creator(creator)
                .title(title)
                .startLocation("Minsk")
                .endLocation("Brest")
                .startDate(LocalDate.of(2026, 5, 1))
                .endDate(LocalDate.of(2026, 5, 2))
                .durationDays(2)
                .transportType("CAR")
                .totalPrice(BigDecimal.valueOf(100))
                .createdAt(LocalDateTime.now())
                .build();
        entityManager.persist(route);
        entityManager.flush();
        return route;
    }
}
