package com.delivry.backend.domain.repository;

import com.delivry.backend.domain.entity.Route;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;


@Repository
public interface RouteRepository extends JpaRepository<Route, Long> {

    List<Route> findByCreator_UserId(Long userId);

    List<Route> findByStartLocation(String startLocation);

    List<Route> findTop10ByOrderByCreatedAtDesc();
   // List<Route> findTop10ByStartDateAfterOrderByStartDateAsc(LocalDate now);

    @Query("""
        SELECT r
        FROM Route r
        WHERE r.startDate > :now
        ORDER BY r.startDate ASC
        LIMIT 10
    """)
    List<Route> findTop10ByStartDateAfterOrderByStartDateAsc(@Param("now") LocalDate now);


    @Query("""
    SELECT r FROM Route r
    LEFT JOIN r.participants rp
    WHERE rp.participantStatus.id = 2 OR rp IS NULL
    GROUP BY r
    ORDER BY COUNT(rp) DESC
    LIMIT 10
""")
    List<Route> findTopPopularRoutes();

    long countByCreator_UserId(Long userId);

    @Query("SELECT r FROM Route r JOIN FETCH r.creator c WHERE c.role.roleId = :roleId")
    List<Route> findByCreator_Role_RoleId(@Param("roleId") Long roleId);

}
