package com.delivry.backend.controller;

import com.delivry.backend.application.service.AdminService;
import com.delivry.backend.domain.repository.RoleRepository;
import com.delivry.backend.domain.repository.UserRepository;
import com.delivry.backend.request.CreateEmployeeRequest;
import com.delivry.backend.request.UpdateUserRequest;
import com.delivry.backend.response.AdminStatsResponse;
import com.delivry.backend.response.AdminUserResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Admin", description = "Управление системой — доступно только Администратору")
@SecurityRequirement(name = "bearerAuth")
public class AdminController {

    private static final Logger log = LoggerFactory.getLogger(AdminController.class);

    private final AdminService adminService;
    private final UserRepository userRepository;

    public AdminController(AdminService adminService, UserRepository userRepository) {
        this.adminService = adminService;
        this.userRepository = userRepository;

    }

    @Operation(summary = "Список пользователей")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Список пользователей успешно получен")
    })
    @GetMapping("/users")
    public ResponseEntity<Page<AdminUserResponse>> getUsers(
            Authentication authentication,
            @Parameter(hidden = true)
            @PageableDefault(sort = "userId", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        log.info("Admin users list requested: admin={}, page={}, size={}",
                authentication.getName(), pageable.getPageNumber(), pageable.getPageSize());
        return ResponseEntity.ok(adminService.getUsers(pageable));
    }

    @Operation(summary = "Создать пользователя")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Пользователь успешно создан")
    })
    @PostMapping("/users")
    public ResponseEntity<AdminUserResponse> createEmployee(
            Authentication authentication,
            @Valid @RequestBody CreateEmployeeRequest request
    ) {
        log.info("Admin create user requested: admin={}, targetEmail={}, targetRole={}",
                authentication.getName(), request.getEmail(), request.getRole());
        AdminUserResponse created = adminService.createEmployee(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @Operation(summary = "Обновить пользователя")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Пользователь успешно обновлён")
    })
    @PutMapping("/users/{id}")
    public ResponseEntity<AdminUserResponse> updateUser(
            Authentication authentication,
            @PathVariable("id") Long id,
            @Valid @RequestBody UpdateUserRequest request
    ) {
        log.info("Admin update user requested: admin={}, userId={}, newEmail={}, newRole={}, newStatus={}",
                authentication.getName(), id, request.getEmail(), request.getRole(), request.getStatus());
        AdminUserResponse updated = adminService.updateUser(id, request);
        return ResponseEntity.ok(updated);
    }

    @Operation(summary = "Удалить пользователя")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Пользователь успешно удалён")
    })
    @DeleteMapping("/users/{id}")
    public ResponseEntity<Void> deleteUser(
            Authentication authentication,
            @PathVariable("id") Long id
    ) {
        log.info("Admin delete user requested: admin={}, userId={}", authentication.getName(), id);
        adminService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Заблокировать/разблокировать пользователя")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Статус пользователя успешно изменён")
    })
    @PatchMapping("/users/{id}/block")
    public ResponseEntity<AdminUserResponse> blockUser(
            Authentication authentication,
            @PathVariable("id") Long id,
            @RequestParam("block") boolean block
    ) {
        log.info("Admin block toggle requested: admin={}, userId={}, block={}",
                authentication.getName(), id, block);
        AdminUserResponse updated = adminService.setUserBlocked(id, block);
        return ResponseEntity.ok(updated);
    }

    @GetMapping("/stats")
    public AdminStatsResponse getAdminStats(Authentication authentication) {
        log.info("Admin stats requested: admin={}", authentication.getName());
        long activeUsers = userRepository.countByUserStatus_UserStatusName("ACTIVE");
        long blockedUsers = userRepository.countByUserStatus_UserStatusName("BLOCKED");




        return new AdminStatsResponse(activeUsers, blockedUsers);
    }

}
