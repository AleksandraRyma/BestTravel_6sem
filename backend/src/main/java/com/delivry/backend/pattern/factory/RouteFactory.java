package com.delivry.backend.pattern.factory;

import com.delivry.backend.domain.entity.Route;
import com.delivry.backend.domain.entity.User;
import java.time.LocalDate;

/**
 * Абстрактный класс фабрики маршрутов
 */
public abstract class RouteFactory {

    /**
     * Фабричный метод - создает маршрут определенного типа
     */
    public abstract Route createRoute(String title, User creator);

    /**
     * Общий метод для всех фабрик - создает маршрут с базовыми полями
     */
    protected Route createBaseRoute(String title, User creator, String transportType) {
        Route route = new Route();
        route.setTitle(title);
        route.setCreator(creator);
        route.setTransportType(transportType);
        route.setStartDate(LocalDate.now());
        route.setEndDate(LocalDate.now().plusDays(7));
        return route;
    }
}