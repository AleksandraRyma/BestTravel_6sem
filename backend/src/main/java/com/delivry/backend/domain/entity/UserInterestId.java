package com.delivry.backend.domain.entity;

import jakarta.persistence.*;
import lombok.*;

@Embeddable
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UserInterestId implements java.io.Serializable {

    private Long userId;
    private Long interestCategoryId;
}
