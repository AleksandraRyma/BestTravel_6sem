package com.delivry.backend.domain.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "review")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Review {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "review_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "point_of_interest_id")
    private PointOfInterest pointOfInterest;

    @Column(name = "review_rating")
    private Integer rating;

    @Column(name = "review_comment")
    private String comment;

    @Column(name = "review_created_at")
    private java.time.LocalDateTime createdAt;
}
