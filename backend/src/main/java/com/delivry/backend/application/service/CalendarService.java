package com.delivry.backend.application.service;

import com.delivry.backend.domain.entity.*;
import com.delivry.backend.domain.repository.*;
import com.delivry.backend.response.CalendarEventResponse;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class CalendarService {

    private final RouteRepository            routeRepository;
    private final RouteParticipantRepository participantRepository;
    private final UserRepository             userRepository;

    public CalendarService(
            RouteRepository routeRepository,
            RouteParticipantRepository participantRepository,
            UserRepository userRepository
    ) {
        this.routeRepository      = routeRepository;
        this.participantRepository = participantRepository;
        this.userRepository        = userRepository;
    }

    // ─────────────────────────────────────────────────────────────
    // Все маршруты пользователя (созданные + те, где он участник)
    // как события для FullCalendar
    // ─────────────────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public List<CalendarEventResponse> getCalendarEvents(Long userId) {
        // 1. Маршруты, которые пользователь создал
        List<Route> created = routeRepository.findByCreator_UserId(userId);

        // 2. Маршруты, в которых пользователь является участником (ACCEPTED)
        List<Route> joined = participantRepository
                .findByUser_UserIdAndParticipantStatus_Name(userId, "ACCEPTED")
                .stream()
                .map(RouteParticipant::getRoute)
                .collect(Collectors.toList());

        // Объединяем, убираем дубликаты по id
        List<Route> all = created;
        joined.stream()
                .filter(r -> created.stream().noneMatch(c -> c.getRouteId().equals(r.getRouteId())))
                .forEach(all::add);

        return all.stream()
                .filter(r -> r.getStartDate() != null && r.getEndDate() != null)
                .map(r -> toEvent(r, userId))
                .collect(Collectors.toList());
    }

    // ─────────────────────────────────────────────────────────────
    // Добавить маршрут в календарь
    // (у нас маршруты уже являются событиями, поэтому просто
    //  проверяем доступ и возвращаем ОК; при желании можно
    //  добавить отдельную таблицу calendar_entry)
    // ─────────────────────────────────────────────────────────────
    public void addToCalendar(Long userId, Long routeId) {
        Route route = routeRepository.findById(routeId)
                .orElseThrow(() -> new EntityNotFoundException("Маршрут не найден"));

        boolean isCreator     = route.getCreator().getUserId().equals(userId);
        boolean isParticipant = participantRepository
                .findByRoute_RouteIdAndParticipantStatus_Name(routeId, "ACCEPTED")
                .stream()
                .anyMatch(p -> p.getUser().getUserId().equals(userId));

        if (!isCreator && !isParticipant) {
            throw new RuntimeException("Нет доступа к этому маршруту");
        }
        // Маршрут уже доступен в календаре (getCalendarEvents вернёт его)
        // Если нужна отдельная отметка — добавьте поле in_calendar в таблицу route
    }

    // ─────────────────────────────────────────────────────────────
    // Убрать маршрут из отображения в календаре
    // ─────────────────────────────────────────────────────────────
    public void removeFromCalendar(Long userId, Long routeId) {
        // Аналогично — здесь можно хранить список скрытых маршрутов
        // в отдельной таблице hidden_calendar_entry(user_id, route_id)
        // Для MVP просто проверяем что маршрут существует
        routeRepository.findById(routeId)
                .orElseThrow(() -> new EntityNotFoundException("Маршрут не найден"));
    }

    // ─────────────────────────────────────────────────────────────
    private CalendarEventResponse toEvent(Route r, Long currentUserId) {
        CalendarEventResponse e = new CalendarEventResponse();
        e.setId(r.getRouteId());
        e.setTitle(r.getTitle());
        e.setStartDate(r.getStartDate() != null ? r.getStartDate().toString() : null);
        e.setEndDate(r.getEndDate()   != null ? r.getEndDate().toString()   : null);
        e.setStartLocation(r.getStartLocation());
        e.setEndLocation(r.getEndLocation());
        e.setDurationDays(r.getDurationDays());
        e.setTransportType(r.getTransportType());
        e.setTotalPrice(r.getTotalPrice());
        e.setParticipantsCount(
                participantRepository.findByRoute_RouteId(r.getRouteId()).size()
        );
        e.setIsOwner(r.getCreator().getUserId().equals(currentUserId));
        return e;
    }
}