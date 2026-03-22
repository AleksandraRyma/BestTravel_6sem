package com.delivry.backend.response;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
public class RouteListResponse {
    private Long         id;
    private String       title;
    private String       description;         // описание для карточек рекомендаций
    private String       startLocation;
    private String       endLocation;
    private LocalDate    startDate;
    private LocalDate    endDate;
    private Integer      durationDays;
    private String       transportType;
    private BigDecimal   totalPrice;
    private String       imageUrl;
    private int          participantsCount;

    // ── Поля для страницы рекомендаций ────────────────────────
    // Процент совпадения с интересами пользователя (10–99)
    private Integer      matchScore;

    // Категории которые совпали с интересами пользователя
    private List<String> matchedCategories;
}