package com.delivry.backend.pattern.observer;

import com.delivry.backend.domain.entity.Route;

/**
 * Интерфейс наблюдателя (подписчика)
 */
public interface RouteObserver {
    void update(Route route, String eventType, String message);
    Long getObserverId();
}