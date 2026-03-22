package com.delivry.backend.domain.repository;

import com.delivry.backend.domain.entity.InterestCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface InterestCategoryRepository extends JpaRepository<InterestCategory, Long> {

    Optional<InterestCategory> findByName(String name);
}