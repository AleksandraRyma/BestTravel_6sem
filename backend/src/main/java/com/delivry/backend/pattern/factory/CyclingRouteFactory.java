package com.delivry.backend.pattern.factory;

import com.delivry.backend.domain.entity.Route;
import com.delivry.backend.domain.entity.User;
import java.math.BigDecimal;

/**
 * Фабрика для создания велосипедных маршрутов
 */
public class CyclingRouteFactory extends RouteFactory {

    @Override
    public Route createRoute(String title, User creator) {
        Route route = createBaseRoute(title, creator, "BIKE");
        route.setDescription("Велосипедный маршрут с живописными видами");
        route.setStartLocation("Велосипедная станция");
        route.setEndLocation("Парк");
        route.setBudgetLimit(BigDecimal.valueOf(100));
        route.setTotalPrice(BigDecimal.valueOf(50));
        return route;
    }
}