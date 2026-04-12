package com.delivry.backend.pattern.factory;

import com.delivry.backend.domain.entity.Route;
import com.delivry.backend.domain.entity.User;
import java.math.BigDecimal;
import java.time.LocalDate;


public class HikingRouteFactory extends RouteFactory {

    @Override
    public Route createRoute(String title, User creator) {
        Route route = createBaseRoute(title, creator, "WALK");
        route.setDescription("Живописный пеший маршрут по горам и лесам");
        route.setStartLocation("Горная тропа");
        route.setEndLocation("Смотровая площадка");
        route.setBudgetLimit(BigDecimal.valueOf(50));
        route.setTotalPrice(BigDecimal.valueOf(30));
        return route;
    }
}