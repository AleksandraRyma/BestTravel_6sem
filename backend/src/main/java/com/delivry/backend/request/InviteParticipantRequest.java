package com.delivry.backend.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class InviteParticipantRequest {

    @NotBlank(message = "Email пользователя обязателен")
    @Email(message = "Некорректный email")
    private String email;
}