package com.delivry.backend.pattern.observer;

import com.delivry.backend.domain.entity.Route;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Субъект (издатель) для управления подписками на маршруты
 */
@Slf4j
@Component
public class RouteSubject {

    private final Map<Long, List<RouteObserver>> observersByRoute = new HashMap<>();

    /**
     * Подписать наблюдателя на маршрут
     */
    public void subscribe(Route route, RouteObserver observer) {
        Long routeId = route.getRouteId();
        observersByRoute.computeIfAbsent(routeId, k -> new ArrayList<>());

        if (!observersByRoute.get(routeId).contains(observer)) {
            observersByRoute.get(routeId).add(observer);
            log.info("Наблюдатель {} подписан на маршрут {}",
                    observer.getObserverId(), route.getTitle());
        }
    }

    /**
     * Отписать наблюдателя от маршрута
     */
    public void unsubscribe(Route route, RouteObserver observer) {
        Long routeId = route.getRouteId();
        if (observersByRoute.containsKey(routeId)) {
            observersByRoute.get(routeId).remove(observer);
            log.info("Наблюдатель {} отписан от маршрута {}",
                    observer.getObserverId(), route.getTitle());
        }
    }

    /**
     * Уведомить всех наблюдателей об изменении маршрута
     */
    public void notifyObservers(Route route, String eventType, String message) {
        Long routeId = route.getRouteId();
        if (!observersByRoute.containsKey(routeId)) {
            return;
        }

        List<RouteObserver> observers = new ArrayList<>(observersByRoute.get(routeId));
        log.info("Уведомление {} наблюдателей о маршруте {}: {}",
                observers.size(), route.getTitle(), eventType);

        for (RouteObserver observer : observers) {
            try {
                observer.update(route, eventType, message);
            } catch (Exception e) {
                log.error("Ошибка при уведомлении наблюдателя {}: {}",
                        observer.getObserverId(), e.getMessage());
            }
        }
    }

    /**
     * Уведомить о создании маршрута
     */
    public void notifyRouteCreated(Route route) {
        notifyObservers(route, "ROUTE_CREATED", "Маршрут \"" + route.getTitle() + "\" создан");
    }

    /**
     * Уведомить об изменении маршрута
     */
    public void notifyRouteChanged(Route route) {
        notifyObservers(route, "ROUTE_CHANGED", "Маршрут \"" + route.getTitle() + "\" был изменен");
    }

    /**
     * Уведомить о присоединении участника
     */
    public void notifyParticipantJoined(Route route, String participantName) {
        notifyObservers(route, "PARTICIPANT_JOINED",
                participantName + " присоединился к маршруту \"" + route.getTitle() + "\"");
    }

    /**
     * Уведомить об удалении маршрута
     */
    public void notifyRouteDeleted(Route route) {
        notifyObservers(route, "ROUTE_DELETED", "Маршрут \"" + route.getTitle() + "\" удален");
        // Очистить подписчиков после удаления
        observersByRoute.remove(route.getRouteId());
    }

    /**
     * Получить количество наблюдателей для маршрута
     */
    public int getObserverCount(Route route) {
        return observersByRoute.getOrDefault(route.getRouteId(), new ArrayList<>()).size();
    }
}