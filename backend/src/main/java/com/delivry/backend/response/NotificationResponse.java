package com.delivry.backend.response;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class NotificationResponse {

    private Long    id;
    private String  message;
    private boolean read;
    private String  createdAt;

    // ID связанного маршрута
    private Long    routeId;

    // Организатор (для invite-уведомлений)
    private String  inviterName;
    private String  inviterEmail;

    // Краткие данные маршрута
    private RouteDto route;

    // ── КЛЮЧЕВОЕ ПОЛЕ ──────────────────────────────────────────────
    // ID того кто отправил уведомление (инициатор действия).
    // Фронт: если senderId == currentUserId → это я сам создал, кнопок нет.
    // Если senderId != currentUserId → мне прислали, могу ответить.
    private Long    senderId;

    // Актуальный статус участия пользователя в маршруте:
    //   "PENDING"   — ещё не ответил  → показываем кнопки принять/отклонить
    //   "ACCEPTED"  → уже принял      → скрываем кнопки
    //   "REJECTED"  → уже отклонил    → скрываем кнопки
    //   null        — не участник (информационное уведомление)
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