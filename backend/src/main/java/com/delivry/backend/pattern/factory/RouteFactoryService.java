package com.delivry.backend.pattern.factory;

import com.delivry.backend.domain.entity.Route;
import com.delivry.backend.domain.entity.User;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;


@Slf4j
@Component
public class RouteFactoryService {

    private final Map<String, RouteFactory> factories = new HashMap<>();

    public RouteFactoryService() {
        // Регистрируем все фабрики
        factories.put("HIKING", new HikingRouteFactory());
        factories.put("CYCLING", new CyclingRouteFactory());
        factories.put("ROAD_TRIP", new RoadTripFactory());
        factories.put("TRANSIT", new TransitTourFactory());
    }


    public Route createRouteByType(String type, String title, User creator) {
        RouteFactory factory = factories.get(type.toUpperCase());

        if (factory == null) {
            log.warn("Неизвестный тип маршрута: {}, создаем стандартный", type);
            return createDefaultRoute(title, creator);
        }

        Route route = factory.createRoute(title, creator);
        log.info("Создан маршрут типа {}: {}", type, title);
        return route;
    }


    public Route createDefaultRoute(String title, User creator) {
        Route route = new Route();
        route.setTitle(title);
        route.setCreator(creator);
        route.setTransportType("CAR");
        route.setDescription("Стандартный маршрут");
        route.setStartLocation("Начальная точка");
        route.setEndLocation("Конечная точка");
        route.setBudgetLimit(java.math.BigDecimal.valueOf(500));
        route.setTotalPrice(java.math.BigDecimal.valueOf(300));
        log.info("Создан стандартный маршрут: {}", title);
        return route;
    }

    public Map<String, String> getAvailableRouteTypes() {
        Map<String, String> types = new HashMap<>();
        types.put("HIKING", "Пеший туризм - для любителей природы и пеших прогулок");
        types.put("CYCLING", "Велосипедные маршруты - активный отдых на велосипеде");
        types.put("ROAD_TRIP", "Автомобильные туры - путешествия на машине");
        types.put("TRANSIT", "Городские экскурсии - на общественном транспорте");
        return types;
    }
}