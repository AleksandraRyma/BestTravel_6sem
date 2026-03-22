package com.delivry.backend.response;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;

@Data
@AllArgsConstructor
public class AdminStatsResponse {
    private long activeUsers;
    private long blockedUsers;


}

