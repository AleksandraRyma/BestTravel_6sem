package com.delivry.backend.application.service;

import com.delivry.backend.domain.entity.*;
import com.delivry.backend.domain.repository.*;
import com.delivry.backend.request.CreateRouteRequest;
import com.delivry.backend.response.RouteDetailResponse;
import com.delivry.backend.response.RouteListResponse;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class RouteService {

    private final RouteRepository             routeRepository;
    private final RoutePointRepository        routePointRepository;
    private final PointOfInterestRepository   poiRepository;
    private final UserRepository              userRepository;
    private final RouteParticipantRepository  participantRepository;
    private final ParticipantStatusRepository participantStatusRepository;
    private final NotificationRepository      notificationRepository;


    public RouteService(
            RouteRepository routeRepository,
            RoutePointRepository routePointRepository,
            PointOfInterestRepository poiRepository,
            UserRepository userRepository,
            RouteParticipantRepository participantRepository,
            ParticipantStatusRepository participantStatusRepository,
            NotificationRepository notificationRepository

    ) {
        this.routeRepository             = routeRepository;
        this.routePointRepository        = routePointRepository;
        this.poiRepository               = poiRepository;
        this.userRepository              = userRepository;
        this.participantRepository       = participantRepository;
        this.participantStatusRepository = participantStatusRepository;
        this.notificationRepository      = notificationRepository;

    }

    // ─────────────────────────────────────────
    // Создание маршрута
    // ─────────────────────────────────────────
    public RouteDetailResponse createRoute(Long creatorId, CreateRouteRequest request) {
        User creator = userRepository.findById(creatorId)
                .orElseThrow(() -> new EntityNotFoundException("Пользователь не найден"));

        int days = (int) ChronoUnit.DAYS.between(request.getStartDate(), request.getEndDate()) + 1;

        Route route = Route.builder()
                .creator(creator)
                .title(request.getTitle())
                .description(request.getDescription())
                .startLocation(request.getStartLocation())
                .endLocation(request.getEndLocation())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .durationDays(days)
                .transportType(request.getTransportType())
                .budgetLimit(request.getBudgetLimit())
                .totalPrice(request.getTotalPrice())
                .routeImageUrl(request.getImageUrl())
                .createdAt(LocalDateTime.now())
                .build();

        routeRepository.save(route);
        savePoints(route, request.getPoints());
        return buildDetail(route, creatorId);
    }

    // ─────────────────────────────────────────
    // Обновление маршрута
    // ─────────────────────────────────────────
    public RouteDetailResponse updateRoute(Long routeId, Long userId, CreateRouteRequest request) {
        Route route = findRoute(routeId);
        assertOwner(route, userId);

        int days = (int) ChronoUnit.DAYS.between(request.getStartDate(), request.getEndDate()) + 1;
        route.setTitle(request.getTitle());
        route.setDescription(request.getDescription());
        route.setStartLocation(request.getStartLocation());
        route.setEndLocation(request.getEndLocation());
        route.setStartDate(request.getStartDate());
        route.setEndDate(request.getEndDate());
        route.setDurationDays(days);
        route.setTransportType(request.getTransportType());
        route.setBudgetLimit(request.getBudgetLimit());
        route.setTotalPrice(request.getTotalPrice());
        route.setRouteImageUrl(request.getImageUrl());
        routeRepository.save(route);

        routePointRepository.deleteByRoute_RouteId(routeId);
        savePoints(route, request.getPoints());
        notifyParticipants(route, "Маршрут «" + route.getTitle() + "» был изменён организатором.");
        return buildDetail(route, userId);
    }

    // ─────────────────────────────────────────
    // Удаление маршрута
    // ─────────────────────────────────────────
    public void deleteRoute(Long routeId, Long userId) {
        Route route = findRoute(routeId);
        assertOwner(route, userId);
        routeRepository.delete(route);
    }

    // ─────────────────────────────────────────
    // Детали маршрута
    // ─────────────────────────────────────────
    @Transactional(readOnly = true)
    public RouteDetailResponse getRouteDetail(Long routeId, Long requesterId) {
        return buildDetail(findRoute(routeId), requesterId);
    }

    // ─────────────────────────────────────────
    // Мои маршруты (старый метод, совместимость)
    // ─────────────────────────────────────────
    @Transactional(readOnly = true)
    public List<RouteListResponse> getMyRoutes(Long userId, String search, String transportType, String sortBy) {
        return applyFilterSort(
                routeRepository.findByCreator_UserId(userId),
                search, transportType, null, null, null,
                sortBy != null ? sortBy : "startDate", "asc", null
        );
    }

    // ─────────────────────────────────────────
    // Мои маршруты — полная фильтрация
    // По умолчанию: startDate asc (ближайшие первыми)
    // ─────────────────────────────────────────
    @Transactional(readOnly = true)
    public List<RouteListResponse> getMyRoutesFiltered(
            Long userId,
            String search,
            String transportType,
            String status,
            String dateFrom,
            String dateTo,
            String sortBy,
            String sortDir
    ) {
        return applyFilterSort(
                routeRepository.findByCreator_UserId(userId),
                search, transportType, status, dateFrom, dateTo,
                sortBy != null ? sortBy : "startDate",
                sortDir != null ? sortDir : "asc",
                null
        );
    }

    // ─────────────────────────────────────────
    // Публичные маршруты
    // ─────────────────────────────────────────
    @Transactional(readOnly = true)
    public List<RouteListResponse> getPublicRoutes(
            String search, String transportType, String sortBy, Double maxBudget
    ) {
        return applyFilterSort(
                routeRepository.findAll(),
                search, transportType, null, null, null,
                sortBy != null ? sortBy : "startDate", "asc", maxBudget
        );
    }

    // ─────────────────────────────────────────
    // Пригласить участника + email
    // ─────────────────────────────────────────
    public void inviteParticipant(Long routeId, Long inviterId, String inviteeEmail) {
        Route route = findRoute(routeId);
        assertOwner(route, inviterId);

        User invitee = userRepository.findByEmail(inviteeEmail)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Пользователь с email «" + inviteeEmail + "» не найден на платформе"));

        // ИСПРАВЛЕНИЕ: используем JPQL-запрос вместо existsById
        // чтобы избежать проблем с порядком полей составного ключа
        if (participantRepository.existsByRouteIdAndUserId(routeId, invitee.getUserId())) {
            throw new RuntimeException("Пользователь уже приглашён или участвует в маршруте");
        }
        RouteParticipantId pid = new RouteParticipantId(routeId, invitee.getUserId());

        ParticipantStatus pending = participantStatusRepository.findByName("PENDING")
                .orElseThrow(() -> new EntityNotFoundException("Статус PENDING не найден"));

        participantRepository.save(RouteParticipant.builder()
                .id(pid).route(route).user(invitee)
                .participantStatus(pending).joinedAt(LocalDateTime.now()).build());

        User inviter = userRepository.findById(inviterId).orElseThrow();

        notificationRepository.save(Notification.builder()
                .user(invitee)
                .message("Вас пригласили в маршрут «" + route.getTitle()
                        + "» (организатор: " + inviter.getFullName() + ")")
                .routeId(routeId)
                .senderId(inviterId)       // кто отправил = организатор
                .isRead(false).createdAt(LocalDateTime.now()).build());


    }

    // ─────────────────────────────────────────
    // Ответ на приглашение
    // ─────────────────────────────────────────
    public void respondToInvite(Long routeId, Long userId, String statusName) {
        // Ищем запись участника: сначала по конкретному routeId
        RouteParticipant participant = participantRepository
                .findByRouteIdAndUserId(routeId, userId)
                .orElseGet(() -> {
                    // Фолбэк: ищем любое PENDING-приглашение этого пользователя
                    // для случаев когда запись создана старым кодом или routeId не совпадает
                    return participantRepository
                            .findByUser_UserIdAndParticipantStatus_Name(userId, "PENDING")
                            .stream()
                            .filter(p -> p.getRoute().getRouteId().equals(routeId))
                            .findFirst()
                            .orElseThrow(() -> new EntityNotFoundException(
                                    "Приглашение не найдено для маршрута " + routeId +
                                            " (userId=" + userId + "). " +
                                            "Проверьте что приглашение существует в таблице route_participant."
                            ));
                });

        ParticipantStatus status = participantStatusRepository.findByName(statusName)
                .orElseThrow(() -> new EntityNotFoundException("Статус не найден: " + statusName));
        participant.setParticipantStatus(status);
        participantRepository.save(participant);

        Route route = findRoute(routeId);
        User responder = userRepository.findById(userId).orElseThrow();
        String action = "ACCEPTED".equals(statusName) ? "принял" : "отклонил";
        notificationRepository.save(Notification.builder()
                .user(route.getCreator())
                .message(responder.getFullName() + " " + action
                        + " приглашение в маршрут «" + route.getTitle() + "»")
                .routeId(routeId)
                .senderId(userId)          // кто ответил = участник
                .isRead(false).createdAt(LocalDateTime.now()).build());
    }

    // ════════════════════════════════════════════════════════════════
    // PRIVATE HELPERS
    // ════════════════════════════════════════════════════════════════

    private void savePoints(Route route, List<CreateRouteRequest.RoutePointRequest> points) {
        if (points == null) return;
        for (int i = 0; i < points.size(); i++) {
            var pr = points.get(i);
            PointOfInterest poi = PointOfInterest.builder()
                    .name(pr.getName()).description(pr.getDescription())
                    .latitude(pr.getLatitude()).longitude(pr.getLongitude())
                    .category(pr.getCategory()).averageRating(0.0).build();
            poiRepository.save(poi);
            routePointRepository.save(RoutePoint.builder()
                    .route(route).pointOfInterest(poi)
                    .visitOrder(pr.getVisitOrder() != null ? pr.getVisitOrder() : i + 1)
                    .plannedTime(pr.getPlannedTime() != null
                            ? LocalDateTime.parse(pr.getPlannedTime()) : null)
                    .build());
        }
    }

    private void notifyParticipants(Route route, String message) {
        participantRepository
                .findByRoute_RouteIdAndParticipantStatus_Name(route.getRouteId(), "ACCEPTED")
                .forEach(p -> notificationRepository.save(Notification.builder()
                        .user(p.getUser()).message(message)
                        .isRead(false).createdAt(LocalDateTime.now()).build()));
    }

    private List<RouteListResponse> applyFilterSort(
            List<Route> routes,
            String search, String transportType, String status,
            String dateFrom, String dateTo,
            String sortBy, String sortDir,
            Double maxBudget
    ) {
        LocalDate today = LocalDate.now();

        return routes.stream()
                .filter(r -> {
                    if (search == null || search.isBlank()) return true;
                    String q = search.toLowerCase();
                    return safeContains(r.getTitle(), q)
                            || safeContains(r.getStartLocation(), q)
                            || safeContains(r.getEndLocation(), q);
                })
                .filter(r -> transportType == null || transportType.isBlank()
                        || transportType.equalsIgnoreCase(r.getTransportType()))
                .filter(r -> {
                    if (status == null || status.isBlank()) return true;
                    return status.equals(calcStatus(r.getStartDate(), r.getEndDate(), today));
                })
                .filter(r -> {
                    if (dateFrom == null || dateFrom.isBlank()) return true;
                    return r.getStartDate() != null
                            && !r.getStartDate().isBefore(LocalDate.parse(dateFrom));
                })
                .filter(r -> {
                    if (dateTo == null || dateTo.isBlank()) return true;
                    return r.getStartDate() != null
                            && !r.getStartDate().isAfter(LocalDate.parse(dateTo));
                })
                .filter(r -> maxBudget == null || r.getTotalPrice() == null
                        || r.getTotalPrice().doubleValue() <= maxBudget)
                .sorted(buildComparator(sortBy, sortDir, today))
                .map(this::toListDto)
                .collect(Collectors.toList());
    }

    private Comparator<Route> buildComparator(String sortBy, String dir, LocalDate today) {
        Comparator<Route> cmp = switch (sortBy == null ? "startDate" : sortBy) {
            case "endDate"      -> Comparator.comparing(
                    r -> r.getEndDate() != null ? r.getEndDate() : LocalDate.MAX);
            case "totalPrice"   -> Comparator.comparing(
                    r -> r.getTotalPrice() != null ? r.getTotalPrice() : BigDecimal.ZERO);
            case "durationDays" -> Comparator.comparingInt(
                    r -> r.getDurationDays() != null ? r.getDurationDays() : 0);
            case "title"        -> Comparator.comparing(
                    r -> r.getTitle() != null ? r.getTitle() : "");
            case "status"       -> Comparator.comparingInt(r -> switch (
                    calcStatus(r.getStartDate(), r.getEndDate(), today)) {
                case "ongoing"  -> 0;
                case "upcoming" -> 1;
                default         -> 2;
            });
            default             -> Comparator.comparing(
                    r -> r.getStartDate() != null ? r.getStartDate() : LocalDate.MAX);
        };
        return "desc".equalsIgnoreCase(dir) ? cmp.reversed() : cmp;
    }

    private String calcStatus(LocalDate start, LocalDate end, LocalDate today) {
        if (start == null) return "past";
        if (today.isBefore(start)) return "upcoming";
        if (end != null && today.isAfter(end)) return "past";
        return "ongoing";
    }

    private boolean safeContains(String value, String query) {
        return value != null && value.toLowerCase().contains(query);
    }

    private RouteListResponse toListDto(Route r) {
        RouteListResponse dto = new RouteListResponse();
        dto.setId(r.getRouteId());
        dto.setTitle(r.getTitle());
        dto.setStartLocation(r.getStartLocation());
        dto.setEndLocation(r.getEndLocation());
        dto.setStartDate(r.getStartDate());
        dto.setEndDate(r.getEndDate());
        dto.setDurationDays(r.getDurationDays());
        dto.setTransportType(r.getTransportType());
        dto.setTotalPrice(r.getTotalPrice());
        dto.setImageUrl(r.getRouteImageUrl());
        dto.setParticipantsCount(
                participantRepository.findByRoute_RouteId(r.getRouteId()).size());
        return dto;
    }

    private RouteDetailResponse buildDetail(Route route, Long requesterId) {
        RouteDetailResponse res = new RouteDetailResponse();
        res.setId(route.getRouteId());
        res.setTitle(route.getTitle());
        res.setDescription(route.getDescription());
        res.setStartLocation(route.getStartLocation());
        res.setEndLocation(route.getEndLocation());
        res.setStartDate(route.getStartDate());
        res.setEndDate(route.getEndDate());
        res.setDurationDays(route.getDurationDays());
        res.setTransportType(route.getTransportType());
        res.setBudgetLimit(route.getBudgetLimit());
        res.setTotalPrice(route.getTotalPrice());
        res.setImageUrl(route.getRouteImageUrl());

        RouteDetailResponse.CreatorDto creator = new RouteDetailResponse.CreatorDto();
        creator.setId(route.getCreator().getUserId());
        creator.setFullName(route.getCreator().getFullName());
        creator.setEmail(route.getCreator().getEmail());
        res.setCreator(creator);

        res.setPoints(routePointRepository
                .findByRoute_RouteIdOrderByVisitOrderAsc(route.getRouteId())
                .stream().map(rp -> {
                    RouteDetailResponse.RoutePointDto dto = new RouteDetailResponse.RoutePointDto();
                    dto.setId(rp.getId());
                    dto.setName(rp.getPointOfInterest().getName());
                    dto.setDescription(rp.getPointOfInterest().getDescription());
                    dto.setLatitude(rp.getPointOfInterest().getLatitude());
                    dto.setLongitude(rp.getPointOfInterest().getLongitude());
                    dto.setCategory(rp.getPointOfInterest().getCategory());
                    dto.setVisitOrder(rp.getVisitOrder());
                    dto.setPlannedTime(rp.getPlannedTime() != null ? rp.getPlannedTime().toString() : null);
                    dto.setAverageRating(rp.getPointOfInterest().getAverageRating());
                    return dto;
                }).collect(Collectors.toList()));

        res.setParticipants(participantRepository
                .findByRoute_RouteId(route.getRouteId())
                .stream().map(p -> {
                    RouteDetailResponse.ParticipantDto dto = new RouteDetailResponse.ParticipantDto();
                    dto.setUserId(p.getUser().getUserId());
                    dto.setFullName(p.getUser().getFullName());
                    dto.setEmail(p.getUser().getEmail());
                    dto.setStatus(p.getParticipantStatus().getName());
                    dto.setJoinedAt(p.getJoinedAt() != null ? p.getJoinedAt().toString() : null);
                    return dto;
                }).collect(Collectors.toList()));

        return res;
    }

    private Route findRoute(Long id) {
        return routeRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Маршрут не найден: " + id));
    }

    private void assertOwner(Route route, Long userId) {
        if (!route.getCreator().getUserId().equals(userId)) {
            throw new RuntimeException("Нет прав на это действие");
        }
    }
}