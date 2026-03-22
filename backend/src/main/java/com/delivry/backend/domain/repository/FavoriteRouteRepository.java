package com.delivry.backend.domain.repository;

import com.delivry.backend.domain.entity.FavoriteRoute;
import com.delivry.backend.domain.entity.FavoriteRouteId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FavoriteRouteRepository extends JpaRepository<FavoriteRoute, FavoriteRouteId> {

    // Все избранные маршруты пользователя
    List<FavoriteRoute> findByUser_UserId(Long userId);

    // Количество избранных
    long countByUser_UserId(Long userId);
}