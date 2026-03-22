package com.delivry.backend.application.service;

import com.delivry.backend.domain.entity.*;
import com.delivry.backend.domain.repository.*;
import com.delivry.backend.response.RouteListResponse;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
public class RecommendationService {

    private final UserRepository             userRepository;
    private final InterestCategoryRepository interestCategoryRepository;
    private final UserInterestRepository     userInterestRepository;
    private final RouteRepository            routeRepository;
    private final RoutePointRepository       routePointRepository;
    private final RouteParticipantRepository participantRepository;

    public RecommendationService(
            UserRepository userRepository,
            InterestCategoryRepository interestCategoryRepository,
            UserInterestRepository userInterestRepository,
            RouteRepository routeRepository,
            RoutePointRepository routePointRepository,
            RouteParticipantRepository participantRepository
    ) {
        this.userRepository             = userRepository;
        this.interestCategoryRepository = interestCategoryRepository;
        this.userInterestRepository     = userInterestRepository;
        this.routeRepository            = routeRepository;
        this.routePointRepository       = routePointRepository;
        this.participantRepository      = participantRepository;
    }

    // ─────────────────────────────────────────────────────────────
    // Получить интересы пользователя
    // ─────────────────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public List<Map<String, String>> getUserInterests(Long userId) {
        return userInterestRepository.findByUser_UserId(userId)
                .stream()
                .map(ui -> {
                    Map<String, String> m = new HashMap<>();
                    m.put("name", ui.getCategory().getName());
                    return m;
                })
                .collect(Collectors.toList());
    }

    // ─────────────────────────────────────────────────────────────
    // Обновить интересы пользователя
    // ─────────────────────────────────────────────────────────────
    public void updateUserInterests(Long userId, List<String> categoryNames) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("Пользователь не найден"));

        // Удаляем старые интересы
        userInterestRepository.deleteByUser_UserId(userId);

        // Добавляем новые
        for (String name : categoryNames) {
            interestCategoryRepository.findByName(name).ifPresent(cat -> {
                UserInterest ui = new UserInterest();
                ui.setId(new UserInterestId(userId, cat.getId()));
                ui.setUser(user);
                ui.setCategory(cat);
                userInterestRepository.save(ui);
            });
        }
    }

    // ─────────────────────────────────────────────────────────────
    // Алгоритм рекомендаций:
    //
    // 1. Берём интересы пользователя (user_interest)
    // 2. Смотрим категории точек его прошлых маршрутов
    // 3. Объединяем в набор "предпочтительных категорий"
    // 4. Из всех публичных маршрутов выбираем те что НЕ принадлежат пользователю
    // 5. Для каждого маршрута считаем matchScore:
    //    - +10 за каждую точку интереса совпадающую с категорией
    //    - +5 за каждого участника (популярность)
    // 6. Сортируем по score, возвращаем топ-20
    // ─────────────────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public List<RouteListResponse> getRecommendations(Long userId) {

        // 1. Интересы пользователя
        Set<String> userCats = userInterestRepository.findByUser_UserId(userId)
                .stream()
                .map(ui -> ui.getCategory().getName().toLowerCase())
                .collect(Collectors.toSet());

        // 2. Категории точек из прошлых маршрутов пользователя
        List<Route> myRoutes = routeRepository.findByCreator_UserId(userId);
        for (Route r : myRoutes) {
            routePointRepository.findByRoute_RouteIdOrderByVisitOrderAsc(r.getRouteId())
                    .stream()
                    .map(rp -> rp.getPointOfInterest().getCategory())
                    .filter(Objects::nonNull)
                    .map(String::toLowerCase)
                    .forEach(userCats::add);
        }

        // 3. Транспортные типы которые пользователь уже использовал
        Set<String> preferredTransport = myRoutes.stream()
                .map(Route::getTransportType)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        // 4. Все маршруты кроме собственных пользователя
        Set<Long> myRouteIds = myRoutes.stream()
                .map(Route::getRouteId)
                .collect(Collectors.toSet());

        List<Route> candidates = routeRepository.findAll()
                .stream()
                .filter(r -> !r.getCreator().getUserId().equals(userId))
                .filter(r -> !myRouteIds.contains(r.getRouteId()))
                .collect(Collectors.toList());

        // 5. Считаем score для каждого маршрута
        List<RouteWithScore> scored = new ArrayList<>();

        for (Route r : candidates) {
            int score = 0;

            // Очки за совпадение транспорта
            if (r.getTransportType() != null && preferredTransport.contains(r.getTransportType())) {
                score += 15;
            }

            // Очки за категории точек
            List<RoutePoint> points = routePointRepository.findByRoute_RouteIdOrderByVisitOrderAsc(r.getRouteId());
            Set<String> matchedCats = new LinkedHashSet<>();
            for (RoutePoint rp : points) {
                String cat = rp.getPointOfInterest().getCategory();
                if (cat != null && userCats.contains(cat.toLowerCase())) {
                    score += 10;
                    matchedCats.add(cat);
                }
            }

            // Очки за популярность (участники)
            int participantCount = participantRepository.findByRoute_RouteId(r.getRouteId()).size();
            score += participantCount * 5;

            // Нормализуем до 100
            int finalScore = Math.min(99, Math.max(10, score));

            scored.add(new RouteWithScore(r, finalScore, new ArrayList<>(matchedCats)));
        }

        // 6. Сортируем по убыванию score, берём топ-20
        return scored.stream()
                .sorted((a, b) -> b.score - a.score)
                .limit(20)
                .map(rs -> toDto(rs.route, rs.score, rs.matchedCategories))
                .collect(Collectors.toList());
    }



    // ─────────────────────────────────────────────────────────────
    private RouteListResponse toDto(Route r, int score, List<String> matchedCats) {
        RouteListResponse dto = new RouteListResponse();
        dto.setId(r.getRouteId());
        dto.setTitle(r.getTitle());
        dto.setStartLocation(r.getStartLocation());
        dto.setEndLocation(r.getEndLocation());
        dto.setStartDate(r.getStartDate());
        dto.setEndDate(r.getEndDate());
        dto.setDurationDays(r.getDurationDays());
        dto.setTransportType(r.getTransportType());
        dto.setTotalPrice(r.getTotalPrice());
        dto.setImageUrl(r.getRouteImageUrl());
        dto.setParticipantsCount(participantRepository.findByRoute_RouteId(r.getRouteId()).size());
        // matchScore и matchedCategories — расширяем DTO ниже через @JsonAnyGetter или просто кастомный класс
        dto.setMatchScore(score);
        dto.setMatchedCategories(matchedCats);
        dto.setDescription(r.getDescription());
        return dto;
    }

    // ─── Inner helper ─────────────────────────────────────────────
    private static class RouteWithScore {
        final Route  route;
        final int    score;
        final List<String> matchedCategories;
        RouteWithScore(Route r, int s, List<String> cats) { route=r; score=s; matchedCategories=cats; }
    }
}