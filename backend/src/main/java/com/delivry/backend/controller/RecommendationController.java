package com.delivry.backend.controller;

import com.delivry.backend.application.service.FavoritesService;
import com.delivry.backend.application.service.RecommendationService;
import com.delivry.backend.domain.entity.User;
import com.delivry.backend.domain.repository.UserRepository;
import com.delivry.backend.response.RouteListResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/traveler")
public class RecommendationController {

    private final RecommendationService recommendationService;
    private final FavoritesService      favoritesService;
    private final UserRepository        userRepository;

    public RecommendationController(
            RecommendationService recommendationService,
            FavoritesService favoritesService,
            UserRepository userRepository
    ) {
        this.recommendationService = recommendationService;
        this.favoritesService      = favoritesService;
        this.userRepository        = userRepository;
    }

    // ─────────────────────────────────────────────────────────────
    // GET /api/traveler/interests
    // ─────────────────────────────────────────────────────────────
    @GetMapping("/interests")
    public ResponseEntity<List<Map<String, String>>> getInterests(Authentication auth) {
        User user = resolve(auth);
        return ResponseEntity.ok(recommendationService.getUserInterests(user.getUserId()));
    }

    // ─────────────────────────────────────────────────────────────
    // PUT /api/traveler/interests
    // Body: { "categories": ["Природа", "Горы"] }
    // ─────────────────────────────────────────────────────────────
    @PutMapping("/interests")
    public ResponseEntity<String> updateInterests(
            Authentication auth,
            @RequestBody Map<String, List<String>> body
    ) {
        User user = resolve(auth);
        List<String> categories = body.get("categories");
        if (categories == null) {
            return ResponseEntity.badRequest().body("Поле 'categories' обязательно");
        }
        recommendationService.updateUserInterests(user.getUserId(), categories);
        return ResponseEntity.ok("Интересы обновлены");
    }

    // ─────────────────────────────────────────────────────────────
    // GET /api/traveler/recommendations
    // ─────────────────────────────────────────────────────────────
    @GetMapping("/recommendations")
    public ResponseEntity<List<RouteListResponse>> getRecommendations(Authentication auth) {
        User user = resolve(auth);
        return ResponseEntity.ok(recommendationService.getRecommendations(user.getUserId()));
    }

    // ─────────────────────────────────────────────────────────────
    // POST /api/traveler/recommendations/{routeId}/save
    // Сохранить рекомендованный маршрут в избранное
    // (делегируем в FavoritesService — единый источник правды)
    // ─────────────────────────────────────────────────────────────
    @PostMapping("/recommendations/{routeId}/save")
    public ResponseEntity<String> saveRecommendation(
            Authentication auth,
            @PathVariable Long routeId
    ) {
        User user = resolve(auth);
        favoritesService.addFavorite(user.getUserId(), routeId);
        return ResponseEntity.ok("Маршрут сохранён в избранное");
    }

    // ─────────────────────────────────────────────────────────────
    // Методы favorites/{routeId} УБРАНЫ отсюда — они живут только
    // в FavoritesController (/api/traveler/favorites/{routeId})
    // чтобы не было Ambiguous mapping конфликта
    // ─────────────────────────────────────────────────────────────

    private User resolve(Authentication auth) {
        return userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("Пользователь не найден"));
    }
}