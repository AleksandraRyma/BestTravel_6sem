    package com.delivry.backend.domain.entity;

    import jakarta.persistence.*;
    import lombok.*;

    @Embeddable
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public class RouteParticipantId implements java.io.Serializable {

        @Column(name = "route_id")
        private Long routeId;

        @Column(name = "user_id")
        private Long userId;
    }
