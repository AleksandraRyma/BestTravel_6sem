package com.delivry.backend.application.service;

import com.delivry.backend.domain.entity.Route;
import com.delivry.backend.domain.entity.User;
import com.delivry.backend.domain.repository.*;
import com.delivry.backend.request.UpdateTravelerProfileRequest;
import com.delivry.backend.response.TravelerHomeResponse;
import com.delivry.backend.response.TravelerProfileResponse;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.awt.print.Pageable;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class TravelerService {

    private final RouteRepository routeRepository;
    private final InterestCategoryRepository interestCategoryRepository;
    private final UserRepository userRepository;
    private final FavoriteRouteRepository favoriteRouteRepository;
    private final RouteParticipantRepository routeParticipantRepository;
    private final PasswordEncoder passwordEncoder;

    public TravelerService(RouteRepository routeRepository, InterestCategoryRepository interestCategoryRepository, UserRepository userRepository, FavoriteRouteRepository favoriteRouteRepository, RouteParticipantRepository routeParticipantRepository, PasswordEncoder passwordEncoder) {
        this.routeRepository = routeRepository;
        this.interestCategoryRepository = interestCategoryRepository;

        this.userRepository = userRepository;
        this.favoriteRouteRepository = favoriteRouteRepository;
        this.routeParticipantRepository = routeParticipantRepository;
        this.passwordEncoder = passwordEncoder;
    }

    /*public TravelerHomeResponse getHome() {

        //List<Route> promoRoutes = routeRepository.findTop10ByStartDateAfterOrderByStartDateAsc(LocalDate.now());
        // Горящие предложения
        LocalDate today = LocalDate.now();
        List<TravelerHomeResponse.PromoDto> promoRoutes = routeRepository
                .findTop10ByStartDateAfterOrderByStartDateAsc(today)
                .stream()
                .collect(Collectors.toMap(Route::getRouteId, this::toPromo, (r1, r2) -> r1))
                .values()
                .stream()
                .limit(10)
                .toList();


        //List<Route> destinationRoutes = routeRepository.findTopPopularRoutes();

        List<Route> destinationRoutes = routeRepository.findTopPopularRoutes()
                .stream()
                .collect(
                        Collectors.toMap(Route::getRouteId, r -> r, (r1, r2) -> r1)
                )
                .values()
                .stream()
                .limit(10)
                .toList();
        TravelerHomeResponse response = new TravelerHomeResponse();

        // Горящие предложения
        List<TravelerHomeResponse.PromoDto> promos = promoRoutes.stream()
                .limit(10)
                .toList();

        // Популярные направления
        List<TravelerHomeResponse.DestinationDto> destinations = destinationRoutes.stream()
                .limit(10)
                .map(this::toDestination)
                .toList();

        response.setPromos(promos);
        response.setDestinations(destinations);

        response.setThemes(
                interestCategoryRepository.findAll()
                        .stream()
                        .map(c -> c.getName())
                        .toList()
        );

        return response;
    }*/

    public TravelerHomeResponse getHome() {

        //List<Route> promoRoutes = routeRepository.findTop10ByStartDateAfterOrderByStartDateAsc(LocalDate.now());
        // Горящие предложения
        LocalDate today = LocalDate.now();
        List<TravelerHomeResponse.PromoDto> promoRoutes = routeRepository
                .findTop10ByStartDateAfterOrderByStartDateAsc(today)
                .stream()
                .collect(Collectors.toMap(Route::getRouteId, this::toPromo, (r1, r2) -> r1))
                .values()
                .stream()
                .limit(10)
                .toList();


        //List<Route> destinationRoutes = routeRepository.findTopPopularRoutes();

        List<Route> destinationRoutes = routeRepository.findTopPopularRoutes()
                .stream()
                .collect(
                        Collectors.toMap(Route::getRouteId, r -> r, (r1, r2) -> r1)
                )
                .values()
                .stream()
                .limit(10)
                .toList();
        TravelerHomeResponse response = new TravelerHomeResponse();

        // Горящие предложения
        List<TravelerHomeResponse.PromoDto> promos = promoRoutes.stream()
                .limit(10)
                .toList();

        // Популярные направления
        List<TravelerHomeResponse.DestinationDto> destinations = destinationRoutes.stream()
                .limit(10)
                .map(this::toDestination)
                .toList();

        response.setPromos(promos);
        response.setDestinations(destinations);

        response.setThemes(
                interestCategoryRepository.findAll()
                        .stream()
                        .map(c -> c.getName())
                        .toList()
        );

        return response;
    }

    private TravelerHomeResponse.PromoDto toPromo(Route route) {
        TravelerHomeResponse.PromoDto dto = new TravelerHomeResponse.PromoDto();

        dto.setId(route.getRouteId());

        dto.setTitle(
                route.getTitle() != null
                        ? route.getTitle()
                        : "Без названия"
        );

        dto.setPrice(
                route.getTotalPrice() != null
                        ? "от " + route.getTotalPrice() + "€"
                        : "—"
        );

        dto.setImageUrl(
                route.getRouteImageUrl() != null
                        ? route.getRouteImageUrl()
                        : "https://source.unsplash.com/600x400/?travel"
        );

        return dto;
    }


    private TravelerHomeResponse.DestinationDto toDestination(Route route) {
        TravelerHomeResponse.DestinationDto dto = new TravelerHomeResponse.DestinationDto();

        dto.setId(route.getRouteId());

        dto.setTitle(
                route.getEndLocation() != null
                        ? route.getEndLocation()
                        : "Не указано"
        );

        dto.setPrice(
                route.getTotalPrice() != null
                        ? route.getTotalPrice() + "€"
                        : "—"
        );

        dto.setImageUrl( route.getRouteImageUrl());

        return dto;
    }


    // можно потом заменить на поле в БД
    private String getRandomImage() {
        return List.of(
                "https://source.unsplash.com/600x400/?beach",
                "https://source.unsplash.com/600x400/?mountains",
                "https://source.unsplash.com/600x400/?city",
                "https://source.unsplash.com/600x400/?travel"
        ).get((int) (Math.random() * 4));
    }

    @Transactional(readOnly = true)
    public TravelerProfileResponse getProfile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("Пользователь не найден"));

        TravelerProfileResponse response = new TravelerProfileResponse();
        response.setId(user.getUserId());
        response.setFullName(user.getFullName());
        response.setEmail(user.getEmail());
        response.setCreatedAt(user.getCreatedAt());

        // Статистика
        response.setRoutesCreated((int) routeRepository.countByCreator_UserId(userId));
        response.setFavoritesCount((int) favoriteRouteRepository.countByUser_UserId(userId));
        response.setCollaborationsCount((int) routeParticipantRepository.countByUser_UserId(userId));

        return response;
    }

    public TravelerProfileResponse updateProfile(Long userId, UpdateTravelerProfileRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("Пользователь не найден"));

        if (request.getFullName() != null) user.setFullName(request.getFullName());
        if (request.getEmail() != null) user.setEmail(request.getEmail());
        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        }

        User saved = userRepository.save(user);

        return getProfile(saved.getUserId());
    }

}
