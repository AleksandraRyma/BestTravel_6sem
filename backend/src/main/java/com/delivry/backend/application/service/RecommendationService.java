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


    public void updateUserInterests(Long userId, List<String> categoryNames) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("Пользователь не найден"));


        userInterestRepository.deleteByUser_UserId(userId);


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


    @Transactional(readOnly = true)
    public List<RouteListResponse> getRecommendations(Long userId) {


        Set<String> userCats = userInterestRepository.findByUser_UserId(userId)
                .stream()
                .map(ui -> ui.getCategory().getName().toLowerCase())
                .collect(Collectors.toSet());


        List<Route> myRoutes = routeRepository.findByCreator_UserId(userId);
        for (Route r : myRoutes) {
            routePointRepository.findByRoute_RouteIdOrderByVisitOrderAsc(r.getRouteId())
                    .stream()
                    .map(rp -> rp.getPointOfInterest().getCategory())
                    .filter(Objects::nonNull)
                    .map(String::toLowerCase)
                    .forEach(userCats::add);
        }


        Set<String> preferredTransport = myRoutes.stream()
                .map(Route::getTransportType)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());


        Set<Long> myRouteIds = myRoutes.stream()
                .map(Route::getRouteId)
                .collect(Collectors.toSet());

        List<Route> candidates = routeRepository.findAll()
                .stream()
                .filter(r -> !r.getCreator().getUserId().equals(userId))
                .filter(r -> !myRouteIds.contains(r.getRouteId()))
                .collect(Collectors.toList());


        List<RouteWithScore> scored = new ArrayList<>();

        for (Route r : candidates) {
            int score = 0;


            if (r.getTransportType() != null && preferredTransport.contains(r.getTransportType())) {
                score += 15;
            }


            List<RoutePoint> points = routePointRepository.findByRoute_RouteIdOrderByVisitOrderAsc(r.getRouteId());
            Set<String> matchedCats = new LinkedHashSet<>();
            for (RoutePoint rp : points) {
                String cat = rp.getPointOfInterest().getCategory();
                if (cat != null && userCats.contains(cat.toLowerCase())) {
                    score += 10;
                    matchedCats.add(cat);
                }
            }


            int participantCount = participantRepository.findByRoute_RouteId(r.getRouteId()).size();
            score += participantCount * 5;


            int finalScore = Math.min(99, Math.max(10, score));

            scored.add(new RouteWithScore(r, finalScore, new ArrayList<>(matchedCats)));
        }


        return scored.stream()
                .sorted((a, b) -> b.score - a.score)
                .limit(20)
                .map(rs -> toDto(rs.route, rs.score, rs.matchedCategories))
                .collect(Collectors.toList());
    }




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


    private static class RouteWithScore {
        final Route  route;
        final int    score;
        final List<String> matchedCategories;
        RouteWithScore(Route r, int s, List<String> cats) { route=r; score=s; matchedCategories=cats; }
    }
}