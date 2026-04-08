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
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Service
@Transactional
public class AdminService {

    private static final Logger log = LoggerFactory.getLogger(AdminService.class);

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
        log.info("Loading admin users page: page={}, size={}", pageable.getPageNumber(), pageable.getPageSize());
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
        log.info("Admin created user: userId={}, email={}, role={}, status={}",
                saved.getUserId(), saved.getEmail(), role.getRoleName(), status.getUserStatusName());
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
        log.info("Admin changed user block status: userId={}, email={}, newStatus={}",
                saved.getUserId(), saved.getEmail(), saved.getUserStatus().getUserStatusName());
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
        log.info("Admin updated user: userId={}, email={}, role={}, status={}",
                saved.getUserId(), saved.getEmail(),
                saved.getRole() != null ? saved.getRole().getRoleName() : null,
                saved.getUserStatus() != null ? saved.getUserStatus().getUserStatusName() : null);
        return toAdminUserResponse(saved);
    }

    public void deleteUser(Long userId) {
        if (!userRepository.existsById(userId)) {
            throw new EntityNotFoundException("Пользователь не найден");
        }
        userRepository.deleteById(userId);
        log.info("Admin deleted user: userId={}", userId);
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
