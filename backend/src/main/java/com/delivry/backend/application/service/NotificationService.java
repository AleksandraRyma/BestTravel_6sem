package com.delivry.backend.application.service;

import com.delivry.backend.domain.entity.*;
import com.delivry.backend.domain.repository.*;
import com.delivry.backend.response.NotificationResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional
public class NotificationService {

    private final NotificationRepository     notificationRepository;
    private final RouteRepository            routeRepository;
    private final RouteParticipantRepository participantRepository;

    public NotificationService(
            NotificationRepository notificationRepository,
            RouteRepository routeRepository,
            RouteParticipantRepository participantRepository
    ) {
        this.notificationRepository = notificationRepository;
        this.routeRepository        = routeRepository;
        this.participantRepository  = participantRepository;
    }

    @Transactional(readOnly = true)
    public List<NotificationResponse> getNotifications(Long userId) {
        return notificationRepository
                .findByUser_UserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(n -> toResponse(n, userId))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public long countUnread(Long userId) {
        return notificationRepository.countByUser_UserIdAndIsReadFalse(userId);
    }

    public void markRead(Long notificationId, Long userId) {
        notificationRepository.findById(notificationId).ifPresent(n -> {
            if (n.getUser().getUserId().equals(userId)) {
                n.setIsRead(true);
                notificationRepository.save(n);
            }
        });
    }

    public void markAllRead(Long userId) {
        notificationRepository
                .findByUser_UserIdOrderByCreatedAtDesc(userId)
                .stream()
                .filter(n -> !Boolean.TRUE.equals(n.getIsRead()))
                .forEach(n -> {
                    n.setIsRead(true);
                    notificationRepository.save(n);
                });
    }

    // ─────────────────────────────────────────────────────────────
    private NotificationResponse toResponse(Notification n, Long userId) {
        NotificationResponse r = new NotificationResponse();
        r.setId(n.getId());
        r.setMessage(n.getMessage());
        r.setRead(Boolean.TRUE.equals(n.getIsRead()));
        r.setCreatedAt(n.getCreatedAt() != null ? n.getCreatedAt().toString() : null);

        Long routeId = n.getRouteId();
        r.setRouteId(routeId);
        r.setSenderId(n.getSenderId());   // кто инициировал уведомление

        if (routeId != null) {
            // ── Загружаем маршрут ──────────────────────────────────
            routeRepository.findById(routeId).ifPresent(route -> {
                r.setRoute(buildRouteDto(route));

                boolean isInvite = n.getMessage() != null &&
                        (n.getMessage().contains("пригласили") ||
                                n.getMessage().contains("приглашение"));

                if (isInvite && route.getCreator() != null) {
                    r.setInviterName(route.getCreator().getFullName());
                    r.setInviterEmail(route.getCreator().getEmail());
                }
            });

            // ── КЛЮЧЕВОЕ ИСПРАВЛЕНИЕ ───────────────────────────────
            // Проверяем актуальный статус участия пользователя в маршруте.
            // Если ACCEPTED или REJECTED — фронт скроет кнопки принять/отклонить.
            Optional<RouteParticipant> participation =
                    participantRepository.findByRouteIdAndUserId(routeId, userId);

            participation.ifPresent(p -> {
                String status = p.getParticipantStatus() != null
                        ? p.getParticipantStatus().getName()
                        : null;
                // "PENDING" | "ACCEPTED" | "REJECTED"
                r.setParticipantStatus(status);
            });
        }

        return r;
    }

    private NotificationResponse.RouteDto buildRouteDto(Route r) {
        NotificationResponse.RouteDto dto = new NotificationResponse.RouteDto();
        dto.setId(r.getRouteId());
        dto.setTitle(r.getTitle());
        dto.setStartLocation(r.getStartLocation());
        dto.setEndLocation(r.getEndLocation());
        dto.setStartDate(r.getStartDate() != null ? r.getStartDate().toString() : null);
        dto.setEndDate(r.getEndDate()     != null ? r.getEndDate().toString()   : null);
        dto.setDurationDays(r.getDurationDays());
        dto.setTransportType(r.getTransportType());
        dto.setTotalPrice(r.getTotalPrice());
        return dto;
    }
}