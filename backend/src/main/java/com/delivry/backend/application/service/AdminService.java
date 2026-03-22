package com.delivry.backend.application.service;

import com.delivry.backend.domain.entity.Role;
import com.delivry.backend.domain.entity.User;
import com.delivry.backend.domain.entity.UserStatus;
import com.delivry.backend.domain.repository.RoleRepository;
import com.delivry.backend.domain.repository.UserRepository;
import com.delivry.backend.domain.repository.UserStatusRepository;
import com.delivry.backend.request.CreateEmployeeRequest;
import com.delivry.backend.request.UpdateUserRequest;
import com.delivry.backend.response.AdminUserResponse;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Service
@Transactional
public class AdminService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final UserStatusRepository userStatusRepository;
    private final PasswordEncoder passwordEncoder;

    public AdminService(UserRepository userRepository,
                        RoleRepository roleRepository,
                        UserStatusRepository userStatusRepository,
                        PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.userStatusRepository = userStatusRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional(readOnly = true)
    public Page<AdminUserResponse> getUsers(Pageable pageable) {
        return userRepository.findAll(pageable)
                .map(this::toAdminUserResponse);
    }

    public AdminUserResponse createEmployee(CreateEmployeeRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Пользователь с таким email уже существует");
        }

        Role role = resolveRole(request.getRole());
        UserStatus status = resolveStatus(
                request.getStatus() != null && !request.getStatus().isBlank()
                        ? request.getStatus()
                        : "ACTIVE"
        );

        User user = User.builder()
                .fullName(request.getFullName())
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role(role)
                .userStatus(status)
                .build();

        User saved = userRepository.save(user);
        return toAdminUserResponse(saved);
    }

    /**
     * Заблокировать/разблокировать пользователя (используется PATCH /admin/users/{id}/block).
     */
    public AdminUserResponse setUserBlocked(Long userId, boolean block) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("Пользователь не найден"));

        String statusName = block ? "BLOCKED" : "ACTIVE";
        UserStatus status = resolveStatus(statusName);
        user.setUserStatus(status);

        User saved = userRepository.save(user);
        return toAdminUserResponse(saved);
    }

    public AdminUserResponse updateUser(Long userId, UpdateUserRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("Пользователь не найден"));

        if (request.getFullName() != null) {
            user.setFullName(request.getFullName());
        }
        if (request.getEmail() != null) {
            user.setEmail(request.getEmail());
        }
        if (request.getRole() != null) {
            Role role = resolveRole(request.getRole());
            user.setRole(role);
        }
        if (request.getStatus() != null) {
            UserStatus status = resolveStatus(request.getStatus());
            user.setUserStatus(status);
        }
        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        }

        User saved = userRepository.save(user);
        return toAdminUserResponse(saved);
    }

    public void deleteUser(Long userId) {
        if (!userRepository.existsById(userId)) {
            throw new EntityNotFoundException("Пользователь не найден");
        }
        userRepository.deleteById(userId);
    }

    private Role resolveRole(String roleName) {
        String normalized = roleName.toUpperCase();
        Role role = roleRepository.findByRoleName(normalized);
        if (role == null) {
            throw new IllegalArgumentException("Неизвестная роль: " + normalized);
        }
        return role;
    }

    private UserStatus resolveStatus(String statusName) {
        String normalized = statusName.toUpperCase();
        return userStatusRepository.findByUserStatusName(normalized)
                .orElseThrow(() -> new IllegalArgumentException("Неизвестный статус пользователя: " + normalized));
    }

    private AdminUserResponse toAdminUserResponse(User user) {
        AdminUserResponse dto = new AdminUserResponse();
        dto.setId(user.getUserId());
        dto.setEmail(user.getEmail());
        dto.setFullName(user.getFullName());
        dto.setRole(user.getRole() != null ? user.getRole().getRoleName() : null);
        dto.setStatus(user.getUserStatus() != null ? user.getUserStatus().getUserStatusName() : null);
        dto.setCreatedAt(user.getCreatedAt());

        return dto;
    }
}