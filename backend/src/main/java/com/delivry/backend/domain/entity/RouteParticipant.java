package com.delivry.backend.domain.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "route_participant")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RouteParticipant {

    @EmbeddedId
    private RouteParticipantId id;

    @ManyToOne
    @MapsId("routeId")
    @JoinColumn(name = "route_id")
    private Route route;

    @ManyToOne
    @MapsId("userId")
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne
    @JoinColumn(name = "participant_status_id")
    private ParticipantStatus participantStatus;

    @Column(name = "route_participant_joined_at")
    private java.time.LocalDateTime joinedAt;
}
