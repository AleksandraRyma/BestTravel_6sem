package com.delivry.backend.response;

import lombok.Data;
import java.util.List;


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