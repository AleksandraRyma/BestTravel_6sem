package com.delivry.backend.domain.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.List;

@Entity
@Table(name = "route")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Route {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "route_id")
    private Long routeId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "route_creator_id")
    private User creator;

    @Column(name = "route_title", nullable = false)
    private String title;

    @Column(name = "route_description")
    private String description;

    @Column(name = "route_image_url")
    private String routeImageUrl;

    @Column(name = "route_start_location")
    private String startLocation;

    @Column(name = "route_end_location")
    private String endLocation;

    @Column(name = "route_start_date")
    private java.time.LocalDate startDate;

    @Column(name = "route_end_date")
    private java.time.LocalDate endDate;

    @Column(name = "route_duration_days")
    private Integer durationDays;

    @Column(name = "route_transport_type")
    private String transportType;

    @Column(name = "route_budget_limit")
    private java.math.BigDecimal budgetLimit;

    @Column(name = "route_total_price")
    private java.math.BigDecimal totalPrice;

    @Column(name = "route_created_at")
    private java.time.LocalDateTime createdAt;

    @OneToMany(mappedBy = "route", fetch = FetchType.EAGER, cascade = CascadeType.ALL)
    private List<RouteParticipant> participants;
}
