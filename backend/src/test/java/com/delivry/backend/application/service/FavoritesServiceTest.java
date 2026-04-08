package com.delivry.backend.application.service;

import com.delivry.backend.domain.entity.FavoriteRoute;
import com.delivry.backend.domain.entity.FavoriteRouteId;
import com.delivry.backend.domain.entity.PointOfInterest;
import com.delivry.backend.domain.entity.Route;
import com.delivry.backend.domain.entity.RoutePoint;
import com.delivry.backend.domain.entity.User;
import com.delivry.backend.domain.repository.FavoriteRouteRepository;
import com.delivry.backend.domain.repository.ReviewRepository;
import com.delivry.backend.domain.repository.RoutePointRepository;
import com.delivry.backend.domain.repository.RouteRepository;
import com.delivry.backend.domain.repository.UserRepository;
import com.delivry.backend.response.FavoriteRouteResponse;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class FavoritesServiceTest {

    @Mock
    private FavoriteRouteRepository favoriteRouteRepository;
    @Mock
    private RouteRepository routeRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private ReviewRepository reviewRepository;
    @Mock
    private RoutePointRepository routePointRepository;

    @InjectMocks
    private FavoritesService favoritesService;

    private Route cityRoute;
    private Route mountainRoute;

    @BeforeEach
    void setUp() {
        cityRoute = Route.builder()
                .routeId(10L)
                .title("City Walk")
                .startLocation("Minsk")
                .endLocation("Grodno")
                .startDate(LocalDate.of(2026, 5, 10))
                .endDate(LocalDate.of(2026, 5, 12))
                .durationDays(3)
                .transportType("WALK")
                .totalPrice(BigDecimal.valueOf(120))
                .build();

        mountainRoute = Route.builder()
                .routeId(20L)
                .title("Mountain Escape")
                .startLocation("Brest")
                .endLocation("Sochi")
                .startDate(LocalDate.of(2026, 6, 1))
                .endDate(LocalDate.of(2026, 6, 5))
                .durationDays(5)
                .transportType("CAR")
                .totalPrice(BigDecimal.valueOf(450))
                .build();
    }

    @Test
    void getFavoritesShouldFilterAndSortByRating() {
        FavoriteRoute first = favorite(cityRoute, 1L, LocalDateTime.of(2026, 4, 1, 10, 0));
        FavoriteRoute second = favorite(mountainRoute, 1L, LocalDateTime.of(2026, 4, 2, 10, 0));

        when(favoriteRouteRepository.findByUser_UserId(1L)).thenReturn(List.of(first, second));
        when(routePointRepository.findByRoute_RouteIdOrderByVisitOrderAsc(10L)).thenReturn(List.of(
                routePoint(4.0),
                routePoint(5.0)
        ));
        when(routePointRepository.findByRoute_RouteIdOrderByVisitOrderAsc(20L)).thenReturn(List.of(
                routePoint(3.0)
        ));

        List<FavoriteRouteResponse> result = favoritesService.getFavorites(
                1L,
                "walk",
                "WALK",
                100.0,
                150.0,
                2,
                4,
                4.4,
                "2026-05-01",
                "2026-05-31",
                "rating",
                "desc"
        );

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getId()).isEqualTo(10L);
        assertThat(result.get(0).getAverageRating()).isEqualTo(4.5);
    }

    @Test
    void addFavoriteShouldPersistWhenFavoriteDoesNotExist() {
        User user = User.builder().userId(7L).email("user@test.com").fullName("User").passwordHash("hash").build();

        when(favoriteRouteRepository.existsById(any(FavoriteRouteId.class))).thenReturn(false);
        when(userRepository.findById(7L)).thenReturn(Optional.of(user));
        when(routeRepository.findById(10L)).thenReturn(Optional.of(cityRoute));

        favoritesService.addFavorite(7L, 10L);

        ArgumentCaptor<FavoriteRoute> captor = ArgumentCaptor.forClass(FavoriteRoute.class);
        verify(favoriteRouteRepository).save(captor.capture());
        FavoriteRoute saved = captor.getValue();
        assertThat(saved.getUser()).isEqualTo(user);
        assertThat(saved.getRoute()).isEqualTo(cityRoute);
        assertThat(saved.getId().getUserId()).isEqualTo(7L);
        assertThat(saved.getId().getRouteId()).isEqualTo(10L);
        assertThat(saved.getCreatedAt()).isNotNull();
    }

    @Test
    void addFavoriteShouldDoNothingWhenFavoriteAlreadyExists() {
        when(favoriteRouteRepository.existsById(any(FavoriteRouteId.class))).thenReturn(true);

        favoritesService.addFavorite(7L, 10L);

        verify(userRepository, never()).findById(7L);
        verify(routeRepository, never()).findById(10L);
        verify(favoriteRouteRepository, never()).save(any());
    }

    @Test
    void addFavoriteShouldThrowWhenRouteIsMissing() {
        User user = User.builder().userId(7L).email("user@test.com").fullName("User").passwordHash("hash").build();

        when(favoriteRouteRepository.existsById(any(FavoriteRouteId.class))).thenReturn(false);
        when(userRepository.findById(7L)).thenReturn(Optional.of(user));
        when(routeRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> favoritesService.addFavorite(7L, 99L))
                .isInstanceOf(EntityNotFoundException.class);
    }

    private FavoriteRoute favorite(Route route, Long userId, LocalDateTime createdAt) {
        FavoriteRoute favoriteRoute = new FavoriteRoute();
        favoriteRoute.setId(new FavoriteRouteId(userId, route.getRouteId()));
        favoriteRoute.setUser(User.builder().userId(userId).email("traveler@test.com").fullName("Traveler").passwordHash("hash").build());
        favoriteRoute.setRoute(route);
        favoriteRoute.setCreatedAt(createdAt);
        return favoriteRoute;
    }

    private RoutePoint routePoint(double rating) {
        return RoutePoint.builder()
                .pointOfInterest(PointOfInterest.builder().averageRating(rating).build())
                .build();
    }
}
