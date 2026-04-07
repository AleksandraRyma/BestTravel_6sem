package com.delivry.backend.domain.repository;

import com.delivry.backend.domain.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {

    List<Review> findByPointOfInterest_Id(Long poiId);

    List<Review> findByUser_UserId(Long userId);

    Optional<Review> findByUser_UserIdAndPointOfInterest_Id(Long userId, Long poiId);
}
