// ─── CalendarEventResponse.java ───────────────────────────────────
package com.delivry.backend.response;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class CalendarEventResponse {
    private Long       id;
    private String     title;
    private String     startDate;       // "yyyy-MM-dd"
    private String     endDate;         // "yyyy-MM-dd"
    private String     startLocation;
    private String     endLocation;
    private Integer    durationDays;
    private String     transportType;
    private BigDecimal totalPrice;
    private Integer    participantsCount;
    private Boolean    isOwner;         // true = создатель, false = участник
}