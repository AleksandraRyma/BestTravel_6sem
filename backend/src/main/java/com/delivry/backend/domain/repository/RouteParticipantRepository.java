package com.delivry.backend.domain.repository;

import com.delivry.backend.domain.entity.RouteParticipant;
import com.delivry.backend.domain.entity.RouteParticipantId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RouteParticipantRepository
        extends JpaRepository<RouteParticipant, RouteParticipantId> {

    // Все участники маршрута
    List<RouteParticipant> findByRoute_RouteId(Long routeId);

    // Участники маршрута с конкретным статусом
    List<RouteParticipant> findByRoute_RouteIdAndParticipantStatus_Name(
            Long routeId, String statusName);

    // Маршруты пользователя с конкретным статусом (используется в Calendar/Notification)
    List<RouteParticipant> findByUser_UserIdAndParticipantStatus_Name(
            Long userId, String statusName);

    // Все участия пользователя
    List<RouteParticipant> findByUser_UserId(Long userId);

    // Количество маршрутов в которых участвует пользователь
    long countByUser_UserId(Long userId);

    // ─────────────────────────────────────────────────────────────
    // ИСПРАВЛЕНИЕ: поиск по route_id + user_id через JPQL
    // Используем вместо findById чтобы избежать проблем с
    // порядком полей в составном ключе RouteParticipantId
    // ─────────────────────────────────────────────────────────────
    @Query("SELECT rp FROM RouteParticipant rp " +
            "WHERE rp.route.routeId = :routeId AND rp.user.userId = :userId")
    Optional<RouteParticipant> findByRouteIdAndUserId(
            @Param("routeId") Long routeId,
            @Param("userId")  Long userId
    );

    // Проверка существования по routeId + userId
    @Query("SELECT COUNT(rp) > 0 FROM RouteParticipant rp " +
            "WHERE rp.route.routeId = :routeId AND rp.user.userId = :userId")
    boolean existsByRouteIdAndUserId(
            @Param("routeId") Long routeId,
            @Param("userId")  Long userId
    );
}