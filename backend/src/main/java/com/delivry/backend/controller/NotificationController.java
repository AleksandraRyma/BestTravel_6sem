package com.delivry.backend.controller;

import com.delivry.backend.application.service.NotificationService;
import com.delivry.backend.domain.repository.RouteParticipantRepository;
import com.delivry.backend.domain.entity.User;
import com.delivry.backend.domain.repository.UserRepository;
import com.delivry.backend.response.NotificationResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

import static java.lang.module.Configuration.resolve;

@RestController
@RequestMapping("/api/traveler/notifications")
public class NotificationController {

    private final NotificationService        notificationService;
    private final UserRepository             userRepository;
    private final RouteParticipantRepository participantRepository;

    public NotificationController(
            NotificationService notificationService,
            UserRepository userRepository,
            RouteParticipantRepository participantRepository
    ) {
        this.notificationService  = notificationService;
        this.userRepository       = userRepository;
        this.participantRepository = participantRepository;
    }

    // ─────────────────────────────────────────────────────────────
    // GET /api/traveler/notifications
    // Возвращает список уведомлений с инфо о маршруте и отправителе
    // ─────────────────────────────────────────────────────────────
    @GetMapping
    public ResponseEntity<List<NotificationResponse>> getAll(Authentication auth) {
        User user = resolve(auth);
        return ResponseEntity.ok(notificationService.getNotifications(user.getUserId()));
    }

    // ─────────────────────────────────────────────────────────────
    // GET /api/traveler/notifications/unread-count
    // ─────────────────────────────────────────────────────────────
    @GetMapping("/unread-count")
    public ResponseEntity<Long> unreadCount(Authentication auth) {
        User user = resolve(auth);
        return ResponseEntity.ok(notificationService.countUnread(user.getUserId()));
    }

    // ─────────────────────────────────────────────────────────────
    // PUT /api/traveler/notifications/{id}/read
    // ─────────────────────────────────────────────────────────────
    @PutMapping("/{id}/read")
    public ResponseEntity<Void> markRead(Authentication auth, @PathVariable Long id) {
        User user = resolve(auth);
        notificationService.markRead(id, user.getUserId());
        return ResponseEntity.noContent().build();
    }

    // ─────────────────────────────────────────────────────────────
    // PUT /api/traveler/notifications/read-all
    // ─────────────────────────────────────────────────────────────
    @PutMapping("/read-all")
    public ResponseEntity<Void> markAllRead(Authentication auth) {
        User user = resolve(auth);
        notificationService.markAllRead(user.getUserId());
        return ResponseEntity.noContent().build();
    }

    private User resolve(Authentication auth) {
        return userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("Пользователь не найден"));
    }



// ─────────────────────────────────────────────────────────────
// GET /api/traveler/notifications/pending-invites
// Возвращает routeId маршрутов с PENDING статусом текущего
// пользователя — нужно для старых уведомлений где routeId=null
// ─────────────────────────────────────────────────────────────
@GetMapping("/pending-invites")
public ResponseEntity<List<Long>> getPendingRouteIds(Authentication auth) {
    User user = resolve(auth);
    List<Long> ids = participantRepository
            .findByUser_UserIdAndParticipantStatus_Name(user.getUserId(), "PENDING")
            .stream()
            .map(p -> p.getRoute().getRouteId())
            .collect(java.util.stream.Collectors.toList());
    return ResponseEntity.ok(ids);
}
}