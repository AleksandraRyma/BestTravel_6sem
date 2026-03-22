package com.delivry.backend.response;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
public class RouteDetailResponse {

    private Long id;
    private String title;
    private String description;
    private String startLocation;
    private String endLocation;
    private LocalDate startDate;
    private LocalDate endDate;
    private Integer durationDays;
    private String transportType;
    private BigDecimal budgetLimit;
    private BigDecimal totalPrice;
    private String imageUrl;

    private CreatorDto creator;
    private List<RoutePointDto> points;
    private List<ParticipantDto> participants;

    @Data
    public static class CreatorDto {
        private Long id;
        private String fullName;
        private String email;
    }

    @Data
    public static class RoutePointDto {
        private Long id;
        private String name;
        private String description;
        private Double latitude;
        private Double longitude;
        private String category;
        private Integer visitOrder;
        private String plannedTime;
        private Double averageRating;
    }

    @Data
    public static class ParticipantDto {
        private Long userId;
        private String fullName;
        private String email;
        private String status;   // PENDING | ACCEPTED | REJECTED
        private String joinedAt;
    }
}