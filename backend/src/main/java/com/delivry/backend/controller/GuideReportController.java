package com.delivry.backend.controller;

import com.delivry.backend.application.service.GuideReportService;
import com.delivry.backend.domain.entity.User;
import com.delivry.backend.domain.repository.UserRepository;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/guide/reports")
public class GuideReportController {

    private final GuideReportService reportService;
    private final UserRepository     userRepository;

    public GuideReportController(GuideReportService reportService, UserRepository userRepository) {
        this.reportService  = reportService;
        this.userRepository = userRepository;
    }

    /**
     * GET /api/guide/reports/export
     *
     * Параметры:
     *   type     — тип отчёта:
     *              popular_poi       — популярные точки интереса
     *              transport_analysis — анализ транспорта
     *              price_duration    — стоимость и длительность
     *              destinations      — популярные направления
     *              favorites_analysis — анализ избранного
     *              user_activity     — активность пользователей
     *              ratings           — рейтинги точек по категориям
     *              full_report       — все отчёты в одном файле
     *   dateFrom — период от (yyyy-MM-dd), необязателен
     *   dateTo   — период до (yyyy-MM-dd), необязателен
     */
    @GetMapping("/export")
    public ResponseEntity<byte[]> export(
            Authentication auth,
            @RequestParam String type,
            @RequestParam(required = false) String dateFrom,
            @RequestParam(required = false) String dateTo
    ) throws Exception {
        User user = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("Пользователь не найден"));

        byte[] xlsx = reportService.generate(user, type, dateFrom, dateTo);

        String date     = java.time.LocalDate.now().toString().replace("-", "");
        String filename = "BestTravel_Report_" + type + "_" + date + ".xlsx";

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename*=UTF-8''" +
                                java.net.URLEncoder.encode(filename, "UTF-8").replace("+", "%20"))
                .contentType(MediaType.parseMediaType(
                        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(xlsx);
    }
}