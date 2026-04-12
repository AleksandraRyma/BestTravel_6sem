package com.delivry.backend.pattern.factory;

import com.delivry.backend.domain.entity.Route;
import com.delivry.backend.domain.entity.User;
import java.time.LocalDate;


public abstract class RouteFactory {


    public abstract Route createRoute(String title, User creator);


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