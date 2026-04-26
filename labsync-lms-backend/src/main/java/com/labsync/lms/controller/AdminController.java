package com.labsync.lms.controller;

import com.labsync.lms.dto.request.GaRunRequest;
import com.labsync.lms.dto.response.ApiResponse;
import com.labsync.lms.model.AlgorithmRun;
import com.labsync.lms.security.UserDetailsImpl;
import com.labsync.lms.service.TimetableService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;

/**
 * AdminController — admin-only operations:
 *   - Trigger Genetic Algorithm to generate timetable
 *   - Apply a completed GA result to the live schedule
 *   - View GA run history
 *   - Regenerate timetable
 *
 * Base URL: /admin
 * All endpoints require ROLE_ADMIN.
 *
 * Sample GA trigger request:
 * {
 *   "populationSize": 50,
 *   "maxGenerations": 200,
 *   "crossoverRate": 0.8,
 *   "mutationRate": 0.05,
 *   "applyResult": true
 * }
 *
 * Sample GA run response:
 * {
 *   "id": 3,
 *   "generations": 200,
 *   "populationSize": 50,
 *   "bestFitnessScore": 0.9200,
 *   "status": "COMPLETED",
 *   "scheduleApplied": true,
 *   "startedAt": "2024-09-01T10:00:00",
 *   "completedAt": "2024-09-01T10:00:45"
 * }
 */
@RestController
@RequestMapping("/admin")
@PreAuthorize("hasRole(\'ADMIN\')")
public class AdminController {
    private final TimetableService timetableService;

    /**
     * POST /admin/generate-timetable
     * Runs the GA with the given parameters.
     * If applyResult=true in the request body, the best solution is saved to DB immediately.
     */
    @PostMapping("/generate-timetable")
    public ResponseEntity<ApiResponse<AlgorithmRun>> generateTimetable(@Valid @RequestBody GaRunRequest request, @AuthenticationPrincipal UserDetailsImpl currentUser) {
        AlgorithmRun run = timetableService.runGeneticAlgorithm(request, currentUser.getId());
        String message = run.isScheduleApplied() ? "Timetable generated and applied (fitness=" + run.getBestFitnessScore() + ")" : "Timetable generated (not applied). Fitness=" + run.getBestFitnessScore();
        return ResponseEntity.ok(ApiResponse.success(message, run));
    }

    /**
     * POST /admin/apply-ga-result/{runId}
     * Applies a previously completed GA run to the live schedule.
     * Use this when you ran the GA with applyResult=false and want to apply later.
     */
    @PostMapping("/apply-ga-result/{runId}")
    public ResponseEntity<ApiResponse<Void>> applyGaResult(@PathVariable("runId") Long runId) {
        timetableService.applyGaResult(runId);
        return ResponseEntity.ok(ApiResponse.success("GA run id=" + runId + " applied to live schedule", null));
    }

    /**
     * POST /admin/regenerate-timetable
     * Convenience endpoint — runs GA with defaults and immediately applies it.
     */
    @PostMapping("/regenerate-timetable")
    public ResponseEntity<ApiResponse<AlgorithmRun>> regenerateTimetable(@AuthenticationPrincipal UserDetailsImpl currentUser) {
        GaRunRequest defaultRequest = new GaRunRequest();
        defaultRequest.setApplyResult(true);
        AlgorithmRun run = timetableService.runGeneticAlgorithm(defaultRequest, currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success("Timetable regenerated (fitness=" + run.getBestFitnessScore() + ")", run));
    }

    /**
     * GET /admin/ga-history
     * Returns all GA runs ordered by most recent first.
     */
    @GetMapping("/ga-history")
    public ResponseEntity<ApiResponse<List<AlgorithmRun>>> getGaHistory() {
        return ResponseEntity.ok(ApiResponse.success(timetableService.getAlgorithmRunHistory()));
    }

    /**
     * GET /admin/ga-history/{id}
     * Returns details of a specific GA run.
     */
    @GetMapping("/ga-history/{id}")
    public ResponseEntity<ApiResponse<AlgorithmRun>> getGaRunById(@PathVariable("id") Long id) {
        List<AlgorithmRun> history = timetableService.getAlgorithmRunHistory();
        AlgorithmRun run = history.stream().filter(r -> r.getId().equals(id)).findFirst().orElseThrow(() -> new com.labsync.lms.exception.ResourceNotFoundException("AlgorithmRun", "id", id));
        return ResponseEntity.ok(ApiResponse.success(run));
    }

    public AdminController(final TimetableService timetableService) {
        this.timetableService = timetableService;
    }
}
