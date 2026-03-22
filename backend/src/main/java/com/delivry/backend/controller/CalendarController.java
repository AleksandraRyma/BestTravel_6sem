package com.delivry.backend.controller;

import com.delivry.backend.application.service.CalendarService;
import com.delivry.backend.domain.entity.User;
import com.delivry.backend.domain.repository.UserRepository;
import com.delivry.backend.response.CalendarEventResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/traveler/calendar")
public class CalendarController {

    private final CalendarService calendarService;
    private final UserRepository  userRepository;

    public CalendarController(CalendarService calendarService, UserRepository userRepository) {
        this.calendarService = calendarService;
        this.userRepository  = userRepository;
    }

    // ─────────────────────────────────────────────────────────────
    // GET /api/traveler/calendar/events
    // Возвращает все маршруты пользователя как события календаря
    // ─────────────────────────────────────────────────────────────
    @GetMapping("/events")
    public ResponseEntity<List<CalendarEventResponse>> getEvents(Authentication auth) {
        User user = resolve(auth);
        return ResponseEntity.ok(calendarService.getCalendarEvents(user.getUserId()));
    }

    // ─────────────────────────────────────────────────────────────
    // POST /api/traveler/calendar/routes/{routeId}
    // Добавить маршрут в календарь (пометить как "в календаре")
    // ─────────────────────────────────────────────────────────────
    @PostMapping("/routes/{routeId}")
    public ResponseEntity<String> addToCalendar(
            Authentication auth,
            @PathVariable Long routeId
    ) {
        User user = resolve(auth);
        calendarService.addToCalendar(user.getUserId(), routeId);
        return ResponseEntity.ok("Маршрут добавлен в календарь");
    }

    // ─────────────────────────────────────────────────────────────
    // DELETE /api/traveler/calendar/routes/{routeId}
    // Убрать маршрут из календаря
    // ─────────────────────────────────────────────────────────────
    @DeleteMapping("/routes/{routeId}")
    public ResponseEntity<String> removeFromCalendar(
            Authentication auth,
            @PathVariable Long routeId
    ) {
        User user = resolve(auth);
        calendarService.removeFromCalendar(user.getUserId(), routeId);
        return ResponseEntity.ok("Маршрут убран из календаря");
    }

    private User resolve(Authentication auth) {
        return userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("Пользователь не найден"));
    }
}