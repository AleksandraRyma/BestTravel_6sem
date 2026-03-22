package com.delivry.backend.domain.entity;


import jakarta.persistence.Embeddable;
import lombok.*;

import java.io.Serializable;

@Embeddable
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class FavoriteRouteId implements Serializable {

    private Long userId;
    private Long routeId;
}
