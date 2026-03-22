package com.delivry.backend.request;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
public class CreateRouteRequest {

    @NotBlank(message = "Название маршрута обязательно")
    @Size(max = 200)
    private String title;

    private String description;

    @NotBlank(message = "Начальная точка обязательна")
    private String startLocation;

    @NotBlank(message = "Конечная точка обязательна")
    private String endLocation;

    @NotNull(message = "Дата начала обязательна")
    private LocalDate startDate;

    @NotNull(message = "Дата окончания обязательна")
    private LocalDate endDate;

    private String transportType;   // WALK | BIKE | CAR | TRANSIT | PLANE

    private BigDecimal budgetLimit;

    private BigDecimal totalPrice;

    private String imageUrl;

    /**
     * Список точек маршрута (POI) в порядке посещения
     */
    private List<RoutePointRequest> points;

    @Data
    public static class RoutePointRequest {

        @NotBlank(message = "Название точки обязательно")
        private String name;

        private String description;

        @NotNull
        private Double latitude;

        @NotNull
        private Double longitude;

        private String category;

        /** Порядковый номер посещения */
        private Integer visitOrder;

        /** Запланированное время посещения */
        private String plannedTime;   // ISO datetime string
    }
}