package com.delivry.backend.controller;

import com.delivry.backend.application.service.GuideStatsService;
import com.delivry.backend.domain.entity.User;
import com.delivry.backend.domain.repository.UserRepository;
import com.delivry.backend.response.GuideStatsResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/guide")
public class GuideStatsController {

    private final GuideStatsService statsService;
    private final UserRepository    userRepository;

    public GuideStatsController(GuideStatsService statsService, UserRepository userRepository) {
        this.statsService   = statsService;
        this.userRepository = userRepository;
    }

    /**
     * GET /api/guide/stats
     * Параметры (необязательны):
     *   dateFrom — yyyy-MM-dd
     *   dateTo   — yyyy-MM-dd
     */
    @GetMapping("/stats")
    public ResponseEntity<GuideStatsResponse> getStats(
            @RequestParam(required = false) String dateFrom,
            @RequestParam(required = false) String dateTo
    ) {
        return ResponseEntity.ok(statsService.getStats(dateFrom, dateTo));
    }

    /**
     * GET /api/guide/stats/export
     * Возвращает Excel (.xlsx) с полным отчётом.
     * В шапке отчёта: дата формирования, имя пользователя, период.
     */
    @GetMapping("/stats/export")
    public ResponseEntity<byte[]> exportExcel(
            Authentication auth,
            @RequestParam(required = false) String dateFrom,
            @RequestParam(required = false) String dateTo
    ) throws Exception {
        User user = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("Пользователь не найден"));

        byte[] xlsx = statsService.exportExcel(user, dateFrom, dateTo);

        String filename = "BestTravel_Otchet_"
                + java.time.LocalDate.now().toString().replace("-", "") + ".xlsx";

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + filename)
                .contentType(MediaType.parseMediaType(
                        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(xlsx);
    }

    /**
     * GET /api/guide/home — заглушка чтобы TourGuigeHomePage не получала 404
     */
    @GetMapping("/home")
    public ResponseEntity<?> getHome(Authentication auth) {
        try {
            User user = userRepository.findByEmail(auth.getName()).orElseThrow();
            var stats = statsService.getStats(null, null);
            return ResponseEntity.ok(java.util.Map.of(
                    "totalRoutes",      stats.getTotalRoutes()       != null ? stats.getTotalRoutes()       : 0,
                    "totalParticipants",stats.getTotalParticipants() != null ? stats.getTotalParticipants() : 0,
                    "rating",           stats.getAverageRating()     != null ? stats.getAverageRating()     : 0.0,
                    "guideName",        user.getFullName()
            ));
        } catch (Exception e) {
            return ResponseEntity.ok(java.util.Map.of(
                    "totalRoutes", 0, "totalParticipants", 0, "rating", 0.0
            ));
        }
    }
}