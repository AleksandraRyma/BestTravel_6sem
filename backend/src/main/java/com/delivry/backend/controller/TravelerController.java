package com.delivry.backend.controller;


import com.delivry.backend.application.service.RouteService;
import com.delivry.backend.application.service.TravelerService;
import com.delivry.backend.domain.entity.User;
import com.delivry.backend.domain.repository.UserRepository;
import com.delivry.backend.request.UpdateTravelerProfileRequest;
import com.delivry.backend.response.RouteListResponse;
import com.delivry.backend.response.TravelerHomeResponse;
import com.delivry.backend.response.TravelerProfileResponse;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/traveler")
public class TravelerController {

    private final TravelerService travelerService;
    private final UserRepository userRepository; // добавь
    private final RouteService routeService;
    public TravelerController(TravelerService travelerService, UserRepository userRepository, RouteService routeService) {
        this.travelerService = travelerService;
        this.userRepository = userRepository;
        this.routeService = routeService;
    }

    @GetMapping("/home")
    public TravelerHomeResponse getHome() {
        return travelerService.getHome();
    }

    @GetMapping("/profile")
    public TravelerProfileResponse getProfile(Authentication authentication) {
        // authentication.getName() возвращает email (из CustomUserDetailsService)
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("Пользователь не найден"));
        return travelerService.getProfile(user.getUserId());
    }

    @PutMapping("/profile")
    public ResponseEntity<TravelerProfileResponse> updateProfile(
            Authentication authentication,
            @Valid @RequestBody UpdateTravelerProfileRequest request
    ) {
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("Пользователь не найден"));
        return ResponseEntity.ok(travelerService.updateProfile(user.getUserId(), request));
    }


    @GetMapping("/my-routes")
    public ResponseEntity<List<RouteListResponse>> getMyRoutes(
            Authentication authentication,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String transportType,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String dateFrom,
            @RequestParam(required = false) String dateTo,
            @RequestParam(defaultValue = "startDate") String sortBy,
            @RequestParam(defaultValue = "asc")       String sortDir
    ) {
        User user = resolveUser(authentication);
        return ResponseEntity.ok(
                routeService.getMyRoutesFiltered(
                        user.getUserId(), search, transportType, status, dateFrom, dateTo, sortBy, sortDir
                )
        );
    }


    // ─────────────────────────────────────────────────────────────
    private User resolveUser(Authentication authentication) {
        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("Пользователь не найден"));
    }
}