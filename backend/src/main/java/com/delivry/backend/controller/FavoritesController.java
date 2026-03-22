package com.delivry.backend.controller;

import com.delivry.backend.application.service.FavoritesService;
import com.delivry.backend.domain.entity.User;
import com.delivry.backend.domain.repository.UserRepository;
import com.delivry.backend.response.FavoriteRouteResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/traveler/favorites")
public class FavoritesController {

    private final FavoritesService favoritesService;
    private final UserRepository   userRepository;

    public FavoritesController(FavoritesService favoritesService, UserRepository userRepository) {
        this.favoritesService = favoritesService;
        this.userRepository   = userRepository;
    }

    // ─────────────────────────────────────────────────────────────
    // GET /api/traveler/favorites
    // Параметры (все необязательны):
    //   search       — поиск по названию/откуда/куда
    //   transportType— WALK|BIKE|CAR|TRANSIT|PLANE
    //   priceMin     — мин. цена
    //   priceMax     — макс. цена
    //   durMin       — мин. дней
    //   durMax       — макс. дней
    //   ratingMin    — мин. рейтинг (напр. 4.0)
    //   dateFrom     — дата начала от (yyyy-MM-dd)
    //   dateTo       — дата начала до (yyyy-MM-dd)
    //   sortBy       — savedAt|rating|price|startDate|duration (default: savedAt)
    //   sortDir      — asc|desc (default: desc)
    // ─────────────────────────────────────────────────────────────
    @GetMapping
    public ResponseEntity<List<FavoriteRouteResponse>> getFavorites(
            Authentication auth,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String transportType,
            @RequestParam(required = false) Double priceMin,
            @RequestParam(required = false) Double priceMax,
            @RequestParam(required = false) Integer durMin,
            @RequestParam(required = false) Integer durMax,
            @RequestParam(required = false) Double ratingMin,
            @RequestParam(required = false) String dateFrom,
            @RequestParam(required = false) String dateTo,
            @RequestParam(defaultValue = "savedAt") String sortBy,
            @RequestParam(defaultValue = "desc")    String sortDir
    ) {
        User user = resolve(auth);
        return ResponseEntity.ok(
                favoritesService.getFavorites(
                        user.getUserId(), search, transportType,
                        priceMin, priceMax, durMin, durMax,
                        ratingMin, dateFrom, dateTo, sortBy, sortDir
                )
        );
    }

    // ─────────────────────────────────────────────────────────────
    // POST /api/traveler/favorites/{routeId}
    // ─────────────────────────────────────────────────────────────
    @PostMapping("/{routeId}")
    public ResponseEntity<String> add(Authentication auth, @PathVariable Long routeId) {
        User user = resolve(auth);
        favoritesService.addFavorite(user.getUserId(), routeId);
        return ResponseEntity.ok("Добавлено в избранное");
    }

    // ─────────────────────────────────────────────────────────────
    // DELETE /api/traveler/favorites/{routeId}
    // ─────────────────────────────────────────────────────────────
    @DeleteMapping("/{routeId}")
    public ResponseEntity<String> remove(Authentication auth, @PathVariable Long routeId) {
        User user = resolve(auth);
        favoritesService.removeFavorite(user.getUserId(), routeId);
        return ResponseEntity.ok("Убрано из избранного");
    }

    // ─────────────────────────────────────────────────────────────
    // GET /api/traveler/favorites/{routeId}/check
    // Проверить добавлен ли маршрут в избранное
    // ─────────────────────────────────────────────────────────────
    @GetMapping("/{routeId}/check")
    public ResponseEntity<Boolean> check(Authentication auth, @PathVariable Long routeId) {
        User user = resolve(auth);
        return ResponseEntity.ok(favoritesService.isFavorite(user.getUserId(), routeId));
    }

    private User resolve(Authentication auth) {
        return userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("Пользователь не найден"));
    }
}