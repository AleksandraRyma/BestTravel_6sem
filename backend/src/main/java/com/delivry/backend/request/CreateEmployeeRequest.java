package com.delivry.backend.request;



import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public class CreateEmployeeRequest {

    @NotBlank(message = "Полное имя обязательно")
    private String fullName;

    @NotBlank(message = "Email обязателен")
    @Email(message = "Некорректный email")
    private String email;

    /**
     * Пароль для нового пользователя.
     * На фронте может быть необязательным при расширении логики,
     * но при создании сотрудника через этот эндпоинт он обязателен.
     */
    @NotBlank(message = "Пароль обязателен")
    private String password;

    /**
     * Роль пользователя: ADMIN, TOUR_GUIDE, TRAVELER.
     */
    @NotBlank(message = "Роль обязательна")
    private String role;

    /**
     * Статус пользователя: ACTIVE, BLOCKED.
     * Если не передан – на уровне сервиса можно выставить ACTIVE по умолчанию.
     */
    private String status;

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
