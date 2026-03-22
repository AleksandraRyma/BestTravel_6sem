package com.delivry.backend.domain.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "participant_status")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ParticipantStatus {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "participant_status_id")
    private Integer id;

    @Column(name = "participant_status_name", unique = true)
    private String name;
}
