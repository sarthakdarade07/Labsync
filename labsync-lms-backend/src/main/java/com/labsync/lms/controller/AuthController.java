package com.labsync.lms.controller;

import com.labsync.lms.dto.request.LoginRequest;
import com.labsync.lms.dto.request.RegisterRequest;
import com.labsync.lms.dto.response.ApiResponse;
import com.labsync.lms.dto.response.JwtResponse;
import com.labsync.lms.model.User;
import com.labsync.lms.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * AuthController — handles login and user registration.
 *
 * Public endpoints:
 * POST /auth/login — returns JWT
 *
 * Admin-only:
 * POST /auth/register — creates a new user (admin or staff)
 *
 * Sample login request:
 * {
 * "username": "admin",
 * "password": "admin123"
 * }
 *
 * Sample login response:
 * {
 * "success": true,
 * "message": "Operation successful",
 * "data": {
 * "token": "eyJhbGci...",
 * "type": "Bearer",
 * "id": 1,
 * "username": "admin",
 * "email": "admin@labsync.com",
 * "roles": ["ROLE_ADMIN"]
 * }
 * }
 */
@RestController
@RequestMapping("/auth")
public class AuthController {
    private final AuthService authService;

    /**
     * POST /auth/login
     * Authenticates user credentials and returns a JWT token.
     */
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<JwtResponse>> login(@Valid @RequestBody LoginRequest loginRequest) {
        JwtResponse jwt = authService.login(loginRequest);
        return ResponseEntity.ok(ApiResponse.success("Login successful", jwt));
    }

    /**
     * POST /auth/register
     * Admin-only: creates a new system user with specified roles.
     */
    @PostMapping("/register")
    @PreAuthorize("hasRole(\'ADMIN\')")
    public ResponseEntity<ApiResponse<String>> register(@Valid @RequestBody RegisterRequest registerRequest) {
        User user = authService.register(registerRequest);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("User registered successfully",
                "User \'" + user.getUsername() + "\' created with id=" + user.getId()));
    }

    public AuthController(final AuthService authService) {
        this.authService = authService;
    }
}
