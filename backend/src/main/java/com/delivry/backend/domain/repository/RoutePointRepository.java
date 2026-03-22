package com.delivry.backend.domain.repository;

import com.delivry.backend.domain.entity.RoutePoint;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;


@Repository
public interface RoutePointRepository extends JpaRepository<RoutePoint, Long> {

    List<RoutePoint> findByRoute_RouteIdOrderByVisitOrderAsc(Long routeId);

    void deleteByRoute_RouteId(Long routeId);
}
