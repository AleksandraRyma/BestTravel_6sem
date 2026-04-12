package com.delivry.backend.response;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class NotificationResponse {

    private Long    id;
    private String  message;
    private boolean read;
    private String  createdAt;


    private Long    routeId;


    private String  inviterName;
    private String  inviterEmail;

    private RouteDto route;

    private Long    senderId;

    private String  participantStatus;

    @Data
    public static class RouteDto {
        private Long       id;
        private String     title;
        private String     startLocation;
        private String     endLocation;
        private String     startDate;
        private String     endDate;
        private Integer    durationDays;
        private String     transportType;
        private BigDecimal totalPrice;
    }
}