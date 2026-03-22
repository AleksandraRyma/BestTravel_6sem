package com.delivry.backend.response;

import lombok.Data;
import java.util.List;

/**
 * ВАЖНО: эта версия совместима с оригинальным TravelerService.java
 * Не добавляем новые поля — оставляем как было чтобы не ломать компиляцию.
 * totalRoutes, totalGuideRoutes, routeCount убраны — они добавляются
 * только если полностью обновить TravelerService.getHome()
 */
@Data
public class TravelerHomeResponse {

    private List<PromoDto>       promos;
    private List<DestinationDto> destinations;
    private List<String>         themes;

    @Data
    public static class PromoDto {
        private Long   id;
        private String title;
        private String price;
        private String imageUrl;
    }

    @Data
    public static class DestinationDto {
        private Long   id;
        private String title;
        private String price;
        private String imageUrl;
    }
}