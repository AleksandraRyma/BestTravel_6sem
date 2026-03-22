package com.delivry.backend.domain.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "interest_category")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InterestCategory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "interest_category_id")
    private Long id;

    @Column(name = "interest_category_name", unique = true)
    private String name;
}
