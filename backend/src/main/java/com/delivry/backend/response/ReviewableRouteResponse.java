package com.delivry.backend.response;

import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Data
public class ReviewableRouteResponse {

    private Long routeId;
    private String title;
    private String startLocation;
    private String endLocation;
    private LocalDate startDate;
    private LocalDate endDate;
    private Integer durationDays;
    private String transportType;
    private Integer pointsCount;
    private Integer reviewedPointsCount;
    private String reviewStatus;
    private List<PointReviewDto> points;

    @Data
    public static class PointReviewDto {
        private Long routePointId;
        private Long pointOfInterestId;
        private Integer visitOrder;
        private String name;
        private String category;
        private Double averageRating;
        private Integer myRating;
        private String myComment;
        private String reviewedAt;
    }
}
