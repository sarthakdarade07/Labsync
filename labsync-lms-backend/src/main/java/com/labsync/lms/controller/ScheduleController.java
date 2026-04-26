package com.labsync.lms.controller;

import com.labsync.lms.dto.request.ScheduleRequest;
import com.labsync.lms.dto.response.ApiResponse;
import com.labsync.lms.dto.response.ClashReport;
import com.labsync.lms.dto.response.ScheduleResponse;
import com.labsync.lms.model.Schedule;
import com.labsync.lms.service.ScheduleService;
import jakarta.validation.Valid;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

/**
 * ScheduleController — manual schedule CRUD + clash validation endpoints.
 *
 * Base URL: /schedules
 *
 * Key endpoints:
 *   POST /schedules/validate  — check for clashes without creating
 *   POST /schedules           — create a schedule (validates automatically)
 *   GET  /schedules/batch/{id} — get all sessions for a batch
 *   GET  /schedules/day/{id}   — get all sessions on a day
 *
 * Sample create request:
 * {
 *   "batchId": 1,
 *   "subjectId": 2,
 *   "staffId": 1,
 *   "labId": 1,
 *   "dayId": 1,
 *   "slotId": 2
 * }
 *
 * Sample clash response (409):
 * {
 *   "success": false,
 *   "message": "Schedule clash detected",
 *   "data": {
 *     "clashes": [
 *       "Lab 'Lab-101' is already booked on Monday at Slot-2",
 *       "Staff 'Dr. Patil' is already assigned on Monday at Slot-2"
 *     ]
 *   }
 * }
 */
@RestController
@RequestMapping("/schedules")
public class ScheduleController {
    private final ScheduleService scheduleService;

    // ── Clash Validation (dry-run) ─────────────────────────────────────────────
    /**
     * POST /schedules/validate
     * Validates a schedule request without persisting — returns all clashes.
     * Useful for frontend pre-validation before submission.
     */
    @PostMapping("/validate")
    public ResponseEntity<ApiResponse<ClashReport>> validateSchedule(@Valid @RequestBody ScheduleRequest request) {
        ClashReport report = scheduleService.validateSchedule(request);
        String message = report.isHasClash() ? "Clashes detected — schedule cannot be created" : "No clashes detected — schedule is valid";
        return ResponseEntity.ok(ApiResponse.success(message, report));
    }

    // ── CRUD ──────────────────────────────────────────────────────────────────
    @GetMapping
    public ResponseEntity<ApiResponse<List<ScheduleResponse>>> getAllSchedules() {
        return ResponseEntity.ok(ApiResponse.success("All schedules fetched", scheduleService.getAllSchedules()));
    }

    @GetMapping("/public")
    public ResponseEntity<ApiResponse<List<ScheduleResponse>>> getPublicSchedules() {
        return ResponseEntity.ok(ApiResponse.success("Public schedules fetched", scheduleService.getAllSchedules()));
    }

    @PostMapping
    @PreAuthorize("hasRole(\'ADMIN\')")
    public ResponseEntity<ApiResponse<ScheduleResponse>> createSchedule(@Valid @RequestBody ScheduleRequest request) {
        Schedule created = scheduleService.createSchedule(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Schedule created", scheduleService.toResponse(created)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole(\'ADMIN\')")
    public ResponseEntity<ApiResponse<ScheduleResponse>> updateSchedule(@PathVariable("id") Long id, @Valid @RequestBody ScheduleRequest request) {
        Schedule updated = scheduleService.updateSchedule(id, request);
        return ResponseEntity.ok(ApiResponse.success("Schedule updated", scheduleService.toResponse(updated)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole(\'ADMIN\')")
    public ResponseEntity<ApiResponse<Void>> deleteSchedule(@PathVariable("id") Long id) {
        scheduleService.deleteSchedule(id);
        return ResponseEntity.ok(ApiResponse.success("Schedule deleted", null));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ScheduleResponse>> getScheduleById(@PathVariable("id") Long id) {
        Schedule s = scheduleService.getScheduleById(id);
        return ResponseEntity.ok(ApiResponse.success(scheduleService.toResponse(s)));
    }

    // ── Filtered views ─────────────────────────────────────────────────────────
    @GetMapping("/batch/{batchId}")
    public ResponseEntity<ApiResponse<List<ScheduleResponse>>> getByBatch(@PathVariable("batchId") Long batchId) {
        return ResponseEntity.ok(ApiResponse.success(scheduleService.getSchedulesByBatch(batchId)));
    }

    @GetMapping("/day/{dayId}")
    public ResponseEntity<ApiResponse<List<ScheduleResponse>>> getByDay(@PathVariable("dayId") Long dayId) {
        return ResponseEntity.ok(ApiResponse.success(scheduleService.getSchedulesByDay(dayId)));
    }

    @GetMapping("/lab/{labId}")
    public ResponseEntity<ApiResponse<List<ScheduleResponse>>> getByLab(@PathVariable("labId") Long labId) {
        return ResponseEntity.ok(ApiResponse.success(scheduleService.getSchedulesByLab(labId)));
    }

    public ScheduleController(final ScheduleService scheduleService) {
        this.scheduleService = scheduleService;
    }
}
