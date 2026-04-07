package com.delivry.backend.pattern.factory;

import com.delivry.backend.domain.entity.Route;
import com.delivry.backend.domain.entity.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * Сервис для работы с фабрикой маршрутов
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class RouteCreationService {

    private final RouteFactoryService routeFactoryService;

    /**
     * Создать маршрут указанного типа
     */
    public Route createRoute(String type, String title, User creator) {
        log.info("Запрос на создание маршрута типа: {}, название: {}", type, title);

        Route route = routeFactoryService.createRouteByType(type, title, creator);

        // Здесь можно добавить дополнительную логику
        // - Сохранение в базу данных
        // - Отправка уведомлений
        // - Проверка бюджета и т.д.

        return route;
    }

    /**
     * Создать несколько маршрутов разных типов
     */
    public void createSampleRoutes(User creator) {
        log.info("Создание примеров маршрутов для пользователя: {}", creator.getFullName());

        Route hikingRoute = routeFactoryService.createRouteByType("HIKING", "Поход в горы", creator);
        Route cyclingRoute = routeFactoryService.createRouteByType("CYCLING", "Велотур по паркам", creator);
        Route roadTrip = routeFactoryService.createRouteByType("ROAD_TRIP", "Путешествие на машине", creator);
        Route transitRoute = routeFactoryService.createRouteByType("TRANSIT", "Экскурсия по городу", creator);

        log.info("Создано {} маршрутов", 4);
    }
}