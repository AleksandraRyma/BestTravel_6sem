package com.delivry.backend.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class SubmitRouteReviewRequest {

    @Valid
    private List<PointReviewRequest> reviews = new ArrayList<>();

    @Data
    public static class PointReviewRequest {

        @NotNull(message = "Идентификатор точки обязателен")
        private Long pointOfInterestId;

        @NotNull(message = "Оценка обязательна")
        @Min(value = 1, message = "Оценка должна быть от 1 до 5")
        @Max(value = 5, message = "Оценка должна быть от 1 до 5")
        private Integer rating;

        private String comment;
    }
}
