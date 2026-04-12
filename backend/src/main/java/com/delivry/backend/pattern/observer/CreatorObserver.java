package com.delivry.backend.pattern.observer;

import com.delivry.backend.domain.entity.Route;
import com.delivry.backend.domain.entity.User;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RequiredArgsConstructor
public class CreatorObserver implements RouteObserver {

    private final User creator;
    @Getter
    private final Long observerId;

    @Override
    public void update(Route route, String eventType, String message) {
        log.info("Уведомление для создателя {} о маршруте {}: {} - {}",
                creator.getFullName(), route.getTitle(), eventType, message);


        if (eventType.equals("PARTICIPANT_JOINED")) {
            log.info("Создатель маршрута: новый участник присоединился!");
        } else if (eventType.equals("ROUTE_CHANGED")) {
            log.info("Создатель маршрута: маршрут был изменен!");
        }
    }
}