package com.delivry.backend.response;

import java.time.LocalDate;
import java.time.LocalDateTime;

public class TravelerProfileResponse {

    private Long id;
    private String fullName;
    private String email;
    private LocalDate createdAt;

    private int routesCreated;
    private int favoritesCount;
    private int collaborationsCount;

    // Геттеры и сеттеры
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public LocalDate getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDate createdAt) { this.createdAt = createdAt; }

    public int getRoutesCreated() { return routesCreated; }
    public void setRoutesCreated(int routesCreated) { this.routesCreated = routesCreated; }

    public int getFavoritesCount() { return favoritesCount; }
    public void setFavoritesCount(int favoritesCount) { this.favoritesCount = favoritesCount; }

    public int getCollaborationsCount() { return collaborationsCount; }
    public void setCollaborationsCount(int collaborationsCount) { this.collaborationsCount = collaborationsCount; }
}
