package com.delivry.backend.domain.repository;

import com.delivry.backend.domain.entity.ParticipantStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ParticipantStatusRepository extends JpaRepository<ParticipantStatus, Integer> {

    Optional<ParticipantStatus> findByName(String name);
}