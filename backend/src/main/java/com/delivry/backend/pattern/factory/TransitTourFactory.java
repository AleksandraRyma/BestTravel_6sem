package com.delivry.backend.pattern.factory;

import com.delivry.backend.domain.entity.Route;
import com.delivry.backend.domain.entity.User;
import java.math.BigDecimal;

/**
 * Фабрика для создания туров на общественном транспорте
 */
public class TransitTourFactory extends RouteFactory {

    @Override
    public Route createRoute(String title, User creator) {
        Route route = createBaseRoute(title, creator, "TRANSIT");
        route.setDescription("Экскурсионный тур с использованием общественного транспорта");
        route.setStartLocation("Центр города");
        route.setEndLocation("Пригород");
        route.setBudgetLimit(BigDecimal.valueOf(300));
        route.setTotalPrice(BigDecimal.valueOf(200));
        return route;
    }
}