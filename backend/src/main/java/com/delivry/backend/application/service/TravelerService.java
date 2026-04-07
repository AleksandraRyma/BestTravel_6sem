package com.delivry.backend.application.service;

import com.delivry.backend.domain.entity.PointOfInterest;
import com.delivry.backend.domain.entity.Review;
import com.delivry.backend.domain.entity.Route;
import com.delivry.backend.domain.entity.RouteParticipant;
import com.delivry.backend.domain.entity.RoutePoint;
import com.delivry.backend.domain.entity.User;
import com.delivry.backend.domain.repository.*;
import com.delivry.backend.request.SubmitRouteReviewRequest;
import com.delivry.backend.request.UpdateTravelerProfileRequest;
import com.delivry.backend.response.ReviewableRouteResponse;
import com.delivry.backend.response.TravelerHomeResponse;
import com.delivry.backend.response.TravelerProfileResponse;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class TravelerService {

    private final RouteRepository routeRepository;
    private final InterestCategoryRepository interestCategoryRepository;
    private final UserRepository userRepository;
    private final FavoriteRouteRepository favoriteRouteRepository;
    private final RouteParticipantRepository routeParticipantRepository;
    private final RoutePointRepository routePointRepository;
    private final ReviewRepository reviewRepository;
    private final PointOfInterestRepository pointOfInterestRepository;
    private final PasswordEncoder passwordEncoder;

    public TravelerService(RouteRepository routeRepository,
                           InterestCategoryRepository interestCategoryRepository,
                           UserRepository userRepository,
                           FavoriteRouteRepository favoriteRouteRepository,
                           RouteParticipantRepository routeParticipantRepository,
                           RoutePointRepository routePointRepository,
                           ReviewRepository reviewRepository,
                           PointOfInterestRepository pointOfInterestRepository,
                           PasswordEncoder passwordEncoder) {
        this.routeRepository = routeRepository;
        this.interestCategoryRepository = interestCategoryRepository;

        this.userRepository = userRepository;
        this.favoriteRouteRepository = favoriteRouteRepository;
        this.routeParticipantRepository = routeParticipantRepository;
        this.routePointRepository = routePointRepository;
        this.reviewRepository = reviewRepository;
        this.pointOfInterestRepository = pointOfInterestRepository;
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

    @Transactional(readOnly = true)
    public List<ReviewableRouteResponse> getReviewableRoutes(Long userId) {
        LocalDate today = LocalDate.now();
        Map<Long, Route> completedRoutes = new LinkedHashMap<>();

        routeRepository.findByCreator_UserId(userId).stream()
                .filter(route -> isCompleted(route, today))
                .sorted(Comparator.comparing(Route::getEndDate, Comparator.nullsLast(Comparator.reverseOrder())))
                .forEach(route -> completedRoutes.put(route.getRouteId(), route));

        routeParticipantRepository.findByUser_UserIdAndParticipantStatus_Name(userId, "ACCEPTED").stream()
                .map(RouteParticipant::getRoute)
                .filter(route -> isCompleted(route, today))
                .sorted(Comparator.comparing(Route::getEndDate, Comparator.nullsLast(Comparator.reverseOrder())))
                .forEach(route -> completedRoutes.putIfAbsent(route.getRouteId(), route));

        return completedRoutes.values().stream()
                .map(route -> toReviewableRoute(route, userId))
                .toList();
    }

    public ReviewableRouteResponse saveRouteReviews(Long userId, Long routeId, SubmitRouteReviewRequest request) {
        Route route = routeRepository.findById(routeId)
                .orElseThrow(() -> new EntityNotFoundException("Маршрут не найден"));

        if (!hasAccessToReviewRoute(route, userId)) {
            throw new RuntimeException("Нет прав на отзыв по этому маршруту");
        }
        if (!isCompleted(route, LocalDate.now())) {
            throw new RuntimeException("Оставить отзыв можно только по завершённому маршруту");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("Пользователь не найден"));

        List<RoutePoint> routePoints = routePointRepository.findByRoute_RouteIdOrderByVisitOrderAsc(routeId);
        Map<Long, RoutePoint> routePointByPoiId = routePoints.stream()
                .collect(Collectors.toMap(rp -> rp.getPointOfInterest().getId(), rp -> rp));

        for (SubmitRouteReviewRequest.PointReviewRequest pointReview : request.getReviews()) {
            RoutePoint routePoint = routePointByPoiId.get(pointReview.getPointOfInterestId());
            if (routePoint == null) {
                throw new RuntimeException("Точка не относится к выбранному маршруту");
            }

            PointOfInterest poi = routePoint.getPointOfInterest();
            Review review = reviewRepository.findByUser_UserIdAndPointOfInterest_Id(userId, poi.getId())
                    .orElseGet(() -> Review.builder()
                            .user(user)
                            .pointOfInterest(poi)
                            .build());

            String comment = pointReview.getComment() != null ? pointReview.getComment().trim() : null;
            review.setRating(pointReview.getRating());
            review.setComment(comment == null || comment.isBlank() ? null : comment);
            review.setCreatedAt(LocalDateTime.now());
            reviewRepository.save(review);

            recalculatePointAverageRating(poi.getId());
        }

        return toReviewableRoute(route, userId);
    }

    private void recalculatePointAverageRating(Long pointOfInterestId) {
        PointOfInterest poi = pointOfInterestRepository.findById(pointOfInterestId)
                .orElseThrow(() -> new EntityNotFoundException("Точка интереса не найдена"));

        double average = reviewRepository.findByPointOfInterest_Id(pointOfInterestId).stream()
                .filter(review -> review.getRating() != null)
                .mapToInt(Review::getRating)
                .average()
                .orElse(0.0);

        poi.setAverageRating(Math.round(average * 100.0) / 100.0);
        pointOfInterestRepository.save(poi);
    }

    private ReviewableRouteResponse toReviewableRoute(Route route, Long userId) {
        List<RoutePoint> routePoints = routePointRepository.findByRoute_RouteIdOrderByVisitOrderAsc(route.getRouteId());
        List<ReviewableRouteResponse.PointReviewDto> points = new ArrayList<>();
        int reviewedCount = 0;

        for (RoutePoint routePoint : routePoints) {
            PointOfInterest poi = routePoint.getPointOfInterest();
            Review existingReview = reviewRepository.findByUser_UserIdAndPointOfInterest_Id(userId, poi.getId()).orElse(null);

            ReviewableRouteResponse.PointReviewDto dto = new ReviewableRouteResponse.PointReviewDto();
            dto.setRoutePointId(routePoint.getId());
            dto.setPointOfInterestId(poi.getId());
            dto.setVisitOrder(routePoint.getVisitOrder());
            dto.setName(poi.getName());
            dto.setCategory(poi.getCategory());
            dto.setAverageRating(poi.getAverageRating());

            if (existingReview != null) {
                dto.setMyRating(existingReview.getRating());
                dto.setMyComment(existingReview.getComment());
                dto.setReviewedAt(existingReview.getCreatedAt() != null ? existingReview.getCreatedAt().toString() : null);
                reviewedCount++;
            }

            points.add(dto);
        }

        ReviewableRouteResponse response = new ReviewableRouteResponse();
        response.setRouteId(route.getRouteId());
        response.setTitle(route.getTitle());
        response.setStartLocation(route.getStartLocation());
        response.setEndLocation(route.getEndLocation());
        response.setStartDate(route.getStartDate());
        response.setEndDate(route.getEndDate());
        response.setDurationDays(route.getDurationDays());
        response.setTransportType(route.getTransportType());
        response.setPoints(points);
        response.setPointsCount(points.size());
        response.setReviewedPointsCount(reviewedCount);
        response.setReviewStatus(reviewedCount == 0 ? "PENDING" : reviewedCount == points.size() ? "DONE" : "PARTIAL");
        return response;
    }

    private boolean hasAccessToReviewRoute(Route route, Long userId) {
        if (route.getCreator() != null && route.getCreator().getUserId().equals(userId)) {
            return true;
        }

        return routeParticipantRepository.findByRouteIdAndUserId(route.getRouteId(), userId)
                .map(routeParticipant -> routeParticipant.getParticipantStatus() != null
                        && "ACCEPTED".equalsIgnoreCase(routeParticipant.getParticipantStatus().getName()))
                .orElse(false);
    }

    private boolean isCompleted(Route route, LocalDate today) {
        return route.getEndDate() != null && route.getEndDate().isBefore(today);
    }

}
