package com.delivry.backend.application.service;

import com.delivry.backend.domain.entity.*;
import com.delivry.backend.domain.repository.*;
import com.delivry.backend.response.FavoriteRouteResponse;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
public class FavoritesService {

    private final FavoriteRouteRepository favoriteRouteRepository;
    private final RouteRepository         routeRepository;
    private final UserRepository          userRepository;
    private final ReviewRepository        reviewRepository;
    private final RoutePointRepository    routePointRepository;

    public FavoritesService(
            FavoriteRouteRepository favoriteRouteRepository,
            RouteRepository routeRepository,
            UserRepository userRepository,
            ReviewRepository reviewRepository,
            RoutePointRepository routePointRepository
    ) {
        this.favoriteRouteRepository = favoriteRouteRepository;
        this.routeRepository         = routeRepository;
        this.userRepository          = userRepository;
        this.reviewRepository        = reviewRepository;
        this.routePointRepository    = routePointRepository;
    }

    @Transactional(readOnly = true)
    public List<FavoriteRouteResponse> getFavorites(
            Long userId,
            String search, String transportType,
            Double priceMin, Double priceMax,
            Integer durMin, Integer durMax,
            Double ratingMin,
            String dateFrom, String dateTo,
            String sortBy, String sortDir
    ) {
        List<FavoriteRoute> favs = favoriteRouteRepository.findByUser_UserId(userId);

        // Парсим даты фильтра один раз — не внутри лямбды
        LocalDate parsedDateFrom = parseDate(dateFrom);
        LocalDate parsedDateTo   = parseDate(dateTo);

        return favs.stream()
                .map(this::toResponse)
                .filter(r -> {
                    // Поиск по тексту
                    if (search != null && !search.isBlank()) {
                        String q = search.toLowerCase();
                        if (!safeContains(r.getTitle(), q) &&
                                !safeContains(r.getStartLocation(), q) &&
                                !safeContains(r.getEndLocation(), q)) return false;
                    }

                    // Транспорт
                    if (transportType != null && !transportType.isBlank() &&
                            !transportType.equalsIgnoreCase(r.getTransportType())) return false;

                    // Цена
                    double price = r.getTotalPrice() != null ? r.getTotalPrice().doubleValue() : 0;
                    if (priceMin != null && price < priceMin) return false;
                    if (priceMax != null && price > priceMax) return false;

                    // Длительность
                    int dur = r.getDurationDays() != null ? r.getDurationDays() : 0;
                    if (durMin != null && dur < durMin) return false;
                    if (durMax != null && dur > durMax) return false;

                    // Рейтинг
                    if (ratingMin != null && r.getAverageRating() < ratingMin) return false;

                    // Даты: r.getStartDate() — это String "yyyy-MM-dd"
                    // Используем parseDate() чтобы получить LocalDate и сравнить корректно
                    if (parsedDateFrom != null || parsedDateTo != null) {
                        LocalDate routeStart = parseDate(r.getStartDate());
                        if (routeStart != null) {
                            if (parsedDateFrom != null && routeStart.isBefore(parsedDateFrom)) return false;
                            if (parsedDateTo   != null && routeStart.isAfter(parsedDateTo))    return false;
                        }
                    }

                    return true;
                })
                .sorted(buildComparator(sortBy, sortDir))
                .collect(Collectors.toList());
    }

    public void addFavorite(Long userId, Long routeId) {
        FavoriteRouteId id = new FavoriteRouteId(userId, routeId);
        if (favoriteRouteRepository.existsById(id)) return;

        User  user  = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("Пользователь не найден"));
        Route route = routeRepository.findById(routeId)
                .orElseThrow(() -> new EntityNotFoundException("Маршрут не найден"));

        FavoriteRoute fav = new FavoriteRoute();
        fav.setId(id);
        fav.setUser(user);
        fav.setRoute(route);
        fav.setCreatedAt(java.time.LocalDateTime.now());
        favoriteRouteRepository.save(fav);
    }

    public void removeFavorite(Long userId, Long routeId) {
        favoriteRouteRepository.deleteById(new FavoriteRouteId(userId, routeId));
    }

    public boolean isFavorite(Long userId, Long routeId) {
        return favoriteRouteRepository.existsById(new FavoriteRouteId(userId, routeId));
    }

    private FavoriteRouteResponse toResponse(FavoriteRoute fav) {
        Route r = fav.getRoute();
        FavoriteRouteResponse res = new FavoriteRouteResponse();
        res.setId(r.getRouteId());
        res.setTitle(r.getTitle());
        res.setStartLocation(r.getStartLocation());
        res.setEndLocation(r.getEndLocation());
        res.setStartDate(r.getStartDate() != null ? r.getStartDate().toString() : null);
        res.setEndDate(r.getEndDate()     != null ? r.getEndDate().toString()   : null);
        res.setDurationDays(r.getDurationDays());
        res.setTransportType(r.getTransportType());
        res.setTotalPrice(r.getTotalPrice());
        res.setSavedAt(fav.getCreatedAt() != null ? fav.getCreatedAt().toString() : null);
        res.setAverageRating(calcAverageRating(r.getRouteId()));
        return res;
    }

    private double calcAverageRating(Long routeId) {
        List<RoutePoint> points = routePointRepository
                .findByRoute_RouteIdOrderByVisitOrderAsc(routeId);
        return points.stream()
                .map(rp -> rp.getPointOfInterest().getAverageRating())
                .filter(Objects::nonNull)
                .filter(d -> d > 0)
                .mapToDouble(Double::doubleValue)
                .average()
                .orElse(0.0);
    }

    private Comparator<FavoriteRouteResponse> buildComparator(String sortBy, String sortDir) {
        Comparator<FavoriteRouteResponse> cmp = switch (sortBy == null ? "savedAt" : sortBy) {
            case "rating"    -> Comparator.comparingDouble(FavoriteRouteResponse::getAverageRating);
            case "price"     -> Comparator.comparing(r ->
                    r.getTotalPrice() != null ? r.getTotalPrice() : BigDecimal.ZERO);
            case "startDate" -> Comparator.comparing(r ->
                    r.getStartDate() != null ? r.getStartDate() : "9999");
            case "duration"  -> Comparator.comparingInt(r ->
                    r.getDurationDays() != null ? r.getDurationDays() : 0);
            default          -> Comparator.comparing(r ->
                    r.getSavedAt() != null ? r.getSavedAt() : "");
        };
        return "asc".equalsIgnoreCase(sortDir) ? cmp : cmp.reversed();
    }

    /**
     * Безопасно парсит строку "yyyy-MM-dd" (или "yyyy-MM-ddTHH:mm:ss") в LocalDate.
     * Возвращает null если строка пустая или невалидная.
     */
    private LocalDate parseDate(String dateStr) {
        if (dateStr == null || dateStr.isBlank()) return null;
        try {
            // Берём только первые 10 символов — "yyyy-MM-dd"
            return LocalDate.parse(dateStr.substring(0, 10));
        } catch (Exception e) {
            return null;
        }
    }

    private boolean safeContains(String val, String q) {
        return val != null && val.toLowerCase().contains(q);
    }
}