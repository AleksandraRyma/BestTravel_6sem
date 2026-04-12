package com.delivry.backend.pattern.observer;

import com.delivry.backend.domain.entity.Route;
import com.delivry.backend.domain.entity.User;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;


@Slf4j
@RequiredArgsConstructor
public class ParticipantObserver implements RouteObserver {

    private final User participant;
    @Getter
    private final Long observerId;

    @Override
    public void update(Route route, String eventType, String message) {

        log.info("Уведомление для участника {} о маршруте {}: {} - {}",
                participant.getFullName(), route.getTitle(), eventType, message);

    }

    public User getParticipant() {
        return participant;
    }
}