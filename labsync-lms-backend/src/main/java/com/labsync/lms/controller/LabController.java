package com.labsync.lms.controller;

import com.labsync.lms.dto.request.ComputerStatusRequest;
import com.labsync.lms.dto.request.LabRequest;
import com.labsync.lms.dto.response.ApiResponse;
import com.labsync.lms.dto.response.LabAvailabilityResponse;
import com.labsync.lms.model.Lab;
import com.labsync.lms.service.LabService;
import jakarta.validation.Valid;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

/**
 * LabController — CRUD + availability dashboard endpoints for Labs.
 *
 * Base URL: /labs
 *
 * Key endpoints:
 *   GET  /labs/availability             — dashboard: all labs with computer status
 *   GET  /labs/{id}/availability        — single lab availability
 *   PATCH /labs/{id}/computers          — update working/faulty counts
 *   GET  /labs/free?dayId=1&slotId=2    — labs free at a given day+slot
 *
 * Sample update-computer-status request:
 * {
 *   "workingComputers": 28,
 *   "faultyComputers": 2
 * }
 *
 * Sample availability response:
 * {
 *   "labId": 1,
 *   "labName": "Lab-101",
 *   "totalComputers": 30,
 *   "workingComputers": 28,
 *   "faultyComputers": 2,
 *   "underMaintenanceComputers": 0,
 *   "availabilityPercentage": 93.3,
 *   "available": true
 * }
 */
@RestController
@RequestMapping("/labs")
public class LabController {
    private final LabService labService;

    // ── CRUD ──────────────────────────────────────────────────────────────────
    @GetMapping
    public ResponseEntity<ApiResponse<List<Lab>>> getAllLabs() {
        return ResponseEntity.ok(ApiResponse.success(labService.getAllLabs()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Lab>> getLabById(@PathVariable("id") Long id) {
        return ResponseEntity.ok(ApiResponse.success(labService.getLabById(id)));
    }

    @PostMapping
    @PreAuthorize("hasRole(\'ADMIN\')")
    public ResponseEntity<ApiResponse<Lab>> createLab(@Valid @RequestBody LabRequest request) {
        Lab created = labService.createLab(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Lab created successfully", created));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole(\'ADMIN\')")
    public ResponseEntity<ApiResponse<Lab>> updateLab(@PathVariable("id") Long id, @Valid @RequestBody LabRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Lab updated", labService.updateLab(id, request)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole(\'ADMIN\')")
    public ResponseEntity<ApiResponse<Void>> deleteLab(@PathVariable("id") Long id) {
        labService.deleteLab(id);
        return ResponseEntity.ok(ApiResponse.success("Lab deleted", null));
    }

    // ── Availability Dashboard ─────────────────────────────────────────────────
    @GetMapping("/availability")
    public ResponseEntity<ApiResponse<List<LabAvailabilityResponse>>> getAllAvailability() {
        return ResponseEntity.ok(ApiResponse.success(labService.getAllLabAvailability()));
    }

    @GetMapping("/{id}/availability")
    public ResponseEntity<ApiResponse<LabAvailabilityResponse>> getLabAvailability(@PathVariable("id") Long id) {
        return ResponseEntity.ok(ApiResponse.success(labService.getLabAvailability(id)));
    }

    /**
     * PATCH /labs/{id}/computers
     * Staff or Admin can update working/faulty computer counts after each session.
     */
    @PatchMapping("/{id}/computers")
    public ResponseEntity<ApiResponse<Lab>> updateComputerStatus(@PathVariable("id") Long id, @Valid @RequestBody ComputerStatusRequest request) {
        Lab updated = labService.updateComputerStatus(id, request);
        return ResponseEntity.ok(ApiResponse.success("Computer status updated", updated));
    }

    /**
     * GET /labs/search-available?dayId=1&startTime=10:00&endTime=12:00&capacity=30&osType=Any
     * Returns labs that are not scheduled for the given day/time and match capacity/OS constraints.
     */
    @GetMapping("/search-available")
    public ResponseEntity<ApiResponse<List<Lab>>> searchAvailableLabs(
            @RequestParam("dayId") Long dayId,
            @RequestParam("startTime") String startTime,
            @RequestParam("endTime") String endTime,
            @RequestParam(value = "capacity", required = false, defaultValue = "1") Integer capacity,
            @RequestParam(value = "osType", required = false) String osType) {
        return ResponseEntity.ok(ApiResponse.success(labService.searchAvailableLabs(dayId, startTime, endTime, capacity, osType)));
    }

    public LabController(final LabService labService) {
        this.labService = labService;
    }
}
