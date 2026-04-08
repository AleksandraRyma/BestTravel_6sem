package com.delivry.backend.domain.repository;

import com.delivry.backend.domain.entity.ParticipantStatus;
import com.delivry.backend.domain.entity.Route;
import com.delivry.backend.domain.entity.RouteParticipant;
import com.delivry.backend.domain.entity.RouteParticipantId;
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

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest(properties = "spring.data.jpa.repositories.bootstrap-mode=lazy")
@Testcontainers(disabledWithoutDocker = true)
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class RouteParticipantRepositoryIT {

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
    private RouteParticipantRepository routeParticipantRepository;
    @Autowired
    private EntityManager entityManager;

    @Test
    void shouldFindParticipantByRouteAndUserUsingCustomQueries() {
        User creator = persistUser("creator@test.com");
        User traveler = persistUser("traveler@test.com");
        Route route = persistRoute(creator, "Weekend");
        ParticipantStatus accepted = ParticipantStatus.builder().name("ACCEPTED").build();
        entityManager.persist(accepted);
        entityManager.flush();

        entityManager.persist(RouteParticipant.builder()
                .id(new RouteParticipantId(route.getRouteId(), traveler.getUserId()))
                .route(route)
                .user(traveler)
                .participantStatus(accepted)
                .joinedAt(LocalDateTime.now())
                .build());
        entityManager.flush();

        assertThat(routeParticipantRepository.existsByRouteIdAndUserId(route.getRouteId(), traveler.getUserId())).isTrue();
        assertThat(routeParticipantRepository.findByRouteIdAndUserId(route.getRouteId(), traveler.getUserId())).isPresent();
        assertThat(routeParticipantRepository.findByRoute_RouteIdAndParticipantStatus_Name(route.getRouteId(), "ACCEPTED"))
                .hasSize(1);
    }

    private User persistUser(String email) {
        User user = User.builder()
                .fullName(email)
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
