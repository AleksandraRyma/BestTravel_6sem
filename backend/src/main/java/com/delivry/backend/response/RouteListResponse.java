package com.delivry.backend.response;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
public class RouteListResponse {
    private Long         id;
    private String       title;
    private String       description;
    private String       startLocation;
    private String       endLocation;
    private LocalDate    startDate;
    private LocalDate    endDate;
    private Integer      durationDays;
    private String       transportType;
    private BigDecimal   totalPrice;
    private String       imageUrl;
    private int          participantsCount;

    private Integer      matchScore;

    private List<String> matchedCategories;
}