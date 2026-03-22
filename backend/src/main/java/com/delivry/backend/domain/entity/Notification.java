package com.delivry.backend.domain.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "notification")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "notification_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "notification_message")
    private String message;

    @Column(name = "notification_is_read")
    private Boolean isRead;

    @Column(name = "notification_created_at")
    private java.time.LocalDateTime createdAt;

    @Column(name = "notification_route_id")
    private Long routeId;

    @Column(name = "notification_sender_id")
    private Long senderId;
}
