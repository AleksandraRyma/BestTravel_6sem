package com.delivry.backend.controller;

import com.delivry.backend.application.service.RouteService;
import com.delivry.backend.domain.entity.User;
import com.delivry.backend.domain.repository.UserRepository;
import com.delivry.backend.request.CreateRouteRequest;
import com.delivry.backend.request.InviteParticipantRequest;
import com.delivry.backend.response.RouteDetailResponse;
import com.delivry.backend.response.RouteListResponse;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/traveler/routes")
public class RouteController {

    private final RouteService routeService;
    private final UserRepository userRepository;

    public RouteController(RouteService routeService, UserRepository userRepository) {
        this.routeService = routeService;
        this.userRepository = userRepository;
    }

    // ─────────────────────────────────────────
    // POST /api/traveler/routes — создать маршрут
    // ─────────────────────────────────────────
    @PostMapping
    public ResponseEntity<RouteDetailResponse> createRoute(
            Authentication authentication,
            @Valid @RequestBody CreateRouteRequest request
    ) {
        User user = getUser(authentication);
        return ResponseEntity.ok(routeService.createRoute(user.getUserId(), request));
    }

    // ─────────────────────────────────────────
    // GET /api/traveler/routes — мои маршруты
    // ─────────────────────────────────────────
    @GetMapping
    public ResponseEntity<List<RouteListResponse>> getMyRoutes(
            Authentication authentication,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String transportType,
            @RequestParam(required = false) String sortBy
    ) {
        User user = getUser(authentication);
        return ResponseEntity.ok(routeService.getMyRoutes(user.getUserId(), search, transportType, sortBy));
    }

    // ─────────────────────────────────────────
    // GET /api/traveler/routes/{id} — детали
    // ─────────────────────────────────────────
    @GetMapping("/{id}")
    public ResponseEntity<RouteDetailResponse> getRoute(
            Authentication authentication,
            @PathVariable Long id
    ) {
        User user = getUser(authentication);
        return ResponseEntity.ok(routeService.getRouteDetail(id, user.getUserId()));
    }

    // ─────────────────────────────────────────
    // PUT /api/traveler/routes/{id} — обновить
    // ─────────────────────────────────────────
    @PutMapping("/{id}")
    public ResponseEntity<RouteDetailResponse> updateRoute(
            Authentication authentication,
            @PathVariable Long id,
            @Valid @RequestBody CreateRouteRequest request
    ) {
        User user = getUser(authentication);
        return ResponseEntity.ok(routeService.updateRoute(id, user.getUserId(), request));
    }

    // ─────────────────────────────────────────
    // DELETE /api/traveler/routes/{id}
    // ─────────────────────────────────────────
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRoute(
            Authentication authentication,
            @PathVariable Long id
    ) {
        User user = getUser(authentication);
        routeService.deleteRoute(id, user.getUserId());
        return ResponseEntity.noContent().build();
    }

    // ─────────────────────────────────────────
    // POST /api/traveler/routes/{id}/invite — пригласить участника
    // ─────────────────────────────────────────
    @PostMapping("/{id}/invite")
    public ResponseEntity<String> inviteParticipant(
            Authentication authentication,
            @PathVariable Long id,
            @Valid @RequestBody InviteParticipantRequest request
    ) {
        User user = getUser(authentication);
        routeService.inviteParticipant(id, user.getUserId(), request.getEmail());
        return ResponseEntity.ok("Приглашение отправлено");
    }

    // ─────────────────────────────────────────
    // POST /api/traveler/routes/{id}/respond — принять/отклонить приглашение
    // ─────────────────────────────────────────
    @PostMapping("/{id}/respond")
    public ResponseEntity<String> respondToInvite(
            Authentication authentication,
            @PathVariable Long id,
            @RequestParam String status   // ACCEPTED | REJECTED
    ) {
        User user = getUser(authentication);
        routeService.respondToInvite(id, user.getUserId(), status);
        return ResponseEntity.ok("Статус обновлён");
    }

    // ─────────────────────────────────────────
    // GET /api/traveler/routes/public — все публичные маршруты
    // ─────────────────────────────────────────
    @GetMapping("/public")
    public ResponseEntity<List<RouteListResponse>> getPublicRoutes(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String transportType,
            @RequestParam(required = false) String sortBy,
            @RequestParam(required = false) Double maxBudget
    ) {
        return ResponseEntity.ok(routeService.getPublicRoutes(search, transportType, sortBy, maxBudget));
    }

    private User getUser(Authentication authentication) {
        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("Пользователь не найден"));
    }
}