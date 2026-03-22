// ─── SearchRouteResponse.java ──────────────────────────────────────
package com.delivry.backend.response;

import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data
public class SearchRouteResponse {
    private Long         id;
    private String       title;
    private String       description;
    private String       startLocation;
    private String       endLocation;
    private String       startDate;          // "yyyy-MM-dd"
    private String       endDate;            // "yyyy-MM-dd"
    private Integer      durationDays;
    private String       transportType;
    private BigDecimal   totalPrice;

    // Данные гида (создателя маршрута с role_id = 2)
    private Long         guideId;
    private String       guideFullName;
    private String       guideEmail;

    // Категории точек маршрута (из point_of_interest.category)
    private List<String> categories;
}

