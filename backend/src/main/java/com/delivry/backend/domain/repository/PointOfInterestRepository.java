package com.delivry.backend.domain.repository;

import com.delivry.backend.domain.entity.PointOfInterest;
import com.delivry.backend.domain.entity.RoutePoint;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;


@Repository
public interface PointOfInterestRepository extends JpaRepository<PointOfInterest, Long> {

}
