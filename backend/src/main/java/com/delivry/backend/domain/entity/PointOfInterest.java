package com.delivry.backend.domain.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "point_of_interest")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PointOfInterest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "point_of_interest_id")
    private Long id;

    @Column(name = "point_of_interest_name")
    private String name;

    @Column(name = "point_of_interest_description")
    private String description;

    @Column(name = "point_of_interest_latitude")
    private Double latitude;

    @Column(name = "point_of_interest_longitude")
    private Double longitude;

    @Column(name = "point_of_interest_category")
    private String category;

    @Column(name = "point_of_interest_average_rating")
    private Double averageRating;
}
