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


    @GetMapping("/events")
    public ResponseEntity<List<CalendarEventResponse>> getEvents(Authentication auth) {
        User user = resolve(auth);
        return ResponseEntity.ok(calendarService.getCalendarEvents(user.getUserId()));
    }


    @PostMapping("/routes/{routeId}")
    public ResponseEntity<String> addToCalendar(
            Authentication auth,
            @PathVariable Long routeId
    ) {
        User user = resolve(auth);
        calendarService.addToCalendar(user.getUserId(), routeId);
        return ResponseEntity.ok("Маршрут добавлен в календарь");
    }


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