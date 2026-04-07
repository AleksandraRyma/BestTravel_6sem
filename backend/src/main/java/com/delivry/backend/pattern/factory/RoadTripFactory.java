package com.delivry.backend.pattern.factory;

import com.delivry.backend.domain.entity.Route;
import com.delivry.backend.domain.entity.User;
import java.math.BigDecimal;

/**
 * Фабрика для создания автомобильных туров
 */
public class RoadTripFactory extends RouteFactory {

    @Override
    public Route createRoute(String title, User creator) {
        Route route = createBaseRoute(title, creator, "CAR");
        route.setDescription("Автомобильное путешествие по городам и достопримечательностям");
        route.setStartLocation("Город отправления");
        route.setEndLocation("Город назначения");
        route.setBudgetLimit(BigDecimal.valueOf(1000));
        route.setTotalPrice(BigDecimal.valueOf(750));
        return route;
    }
}