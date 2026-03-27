package com.labsync.lms.exception;

import com.labsync.lms.dto.response.ApiResponse;
import org.springframework.http.*;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.Map;

/**
 * GlobalExceptionHandler — catches all exceptions thrown by controllers/services
 * and returns consistent JSON error responses.
 *
 * Handled exceptions:
 *  - ResourceNotFoundException    → 404
 *  - DuplicateResourceException   → 409
 *  - ScheduleClashException       → 409 (with clash detail)
 *  - MethodArgumentNotValidException → 400 (field validation errors)
 *  - BadCredentialsException      → 401
 *  - AccessDeniedException        → 403
 *  - Exception (fallback)         → 500
 */
@RestControllerAdvice
public class GlobalExceptionHandler {
    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(GlobalExceptionHandler.class);

    // ── 404 Not Found ────────────────────────────────────────────────────────
    @ExceptionHandler(ResourceNotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public ApiResponse<Void> handleNotFound(ResourceNotFoundException ex) {
        log.warn("Resource not found: {}", ex.getMessage());
        return ApiResponse.error(ex.getMessage());
    }

    // ── 409 Conflict ─────────────────────────────────────────────────────────
    @ExceptionHandler(DuplicateResourceException.class)
    @ResponseStatus(HttpStatus.CONFLICT)
    public ApiResponse<Void> handleDuplicate(DuplicateResourceException ex) {
        log.warn("Duplicate resource: {}", ex.getMessage());
        return ApiResponse.error(ex.getMessage());
    }

    @ExceptionHandler(ScheduleClashException.class)
    @ResponseStatus(HttpStatus.CONFLICT)
    public ApiResponse<Object> handleScheduleClash(ScheduleClashException ex) {
        log.warn("Schedule clash: {}", ex.getMessage());
        return ApiResponse.builder().success(false).message("Schedule clash detected").data(Map.of("clashes", ex.getClashMessages())).build();
    }

    // ── 400 Bad Request ──────────────────────────────────────────────────────
    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ApiResponse<Map<String, String>> handleValidation(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach(error -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            errors.put(fieldName, errorMessage);
        });
        log.warn("Validation failed: {}", errors);
        return ApiResponse.<Map<String, String>>builder().success(false).message("Validation failed").data(errors).build();
    }

    @ExceptionHandler(IllegalArgumentException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ApiResponse<Void> handleIllegalArgument(IllegalArgumentException ex) {
        return ApiResponse.error(ex.getMessage());
    }

    @ExceptionHandler(IllegalStateException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ApiResponse<Void> handleIllegalState(IllegalStateException ex) {
        return ApiResponse.error(ex.getMessage());
    }

    // ── 401 Unauthorized ─────────────────────────────────────────────────────
    @ExceptionHandler(BadCredentialsException.class)
    @ResponseStatus(HttpStatus.UNAUTHORIZED)
    public ApiResponse<Void> handleBadCredentials(BadCredentialsException ex) {
        return ApiResponse.error("Invalid username or password");
    }

    // ── 403 Forbidden ────────────────────────────────────────────────────────
    @ExceptionHandler(AccessDeniedException.class)
    @ResponseStatus(HttpStatus.FORBIDDEN)
    public ApiResponse<Void> handleAccessDenied(AccessDeniedException ex) {
        return ApiResponse.error("Access denied: insufficient permissions");
    }

    // ── 500 Internal Server Error ────────────────────────────────────────────
    @ExceptionHandler(Exception.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public ApiResponse<Object> handleGeneral(Exception ex) {
        log.error("Unexpected error: ", ex);
        return ApiResponse.builder().success(false).message("Unexpected error: " + ex.getMessage()).data(java.util.Arrays.toString(ex.getStackTrace())).build();
    }
}
