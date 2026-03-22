package com.delivry.backend.response;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class FavoriteRouteResponse {
    private Long       id;
    private String     title;
    private String     startLocation;
    private String     endLocation;
    private String     startDate;        // "yyyy-MM-dd"
    private String     endDate;          // "yyyy-MM-dd"
    private Integer    durationDays;
    private String     transportType;
    private BigDecimal totalPrice;
    private String     savedAt;          // когда добавлен в избранное
    private double     averageRating;    // средний рейтинг точек маршрута
}