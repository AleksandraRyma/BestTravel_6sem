package com.delivry.backend.domain.repository;

import com.delivry.backend.domain.entity.UserInterest;
import com.delivry.backend.domain.entity.UserInterestId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserInterestRepository extends JpaRepository<UserInterest, UserInterestId> {

    List<UserInterest> findByUser_UserId(Long userId);

    @Modifying
    @Query("DELETE FROM UserInterest ui WHERE ui.user.userId = :userId")
    void deleteByUser_UserId(@Param("userId") Long userId);
}