package com.labsync.lms.controller;

import com.labsync.lms.dto.request.BatchRequest;
import com.labsync.lms.dto.response.ApiResponse;
import com.labsync.lms.model.Batch;
import com.labsync.lms.service.BatchService;
import jakarta.validation.Valid;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

/**
 * BatchController — CRUD endpoints for Batch management.
 *
 * Base URL: /batches
 *
 * Sample create request:
 * {
 *   "batchName": "SE-A",
 *   "division": "A",
 *   "studentCount": 30,
 *   "semester": "SEM-3",
 *   "programId": 1,
 *   "academicYearId": 1
 * }
 */
@RestController
@RequestMapping("/batches")
public class BatchController {
    private final BatchService batchService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Batch>>> getAllBatches() {
        return ResponseEntity.ok(ApiResponse.success(batchService.getAllBatches()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Batch>> getBatchById(@PathVariable("id") Long id) {
        return ResponseEntity.ok(ApiResponse.success(batchService.getBatchById(id)));
    }

    @GetMapping("/program/{programId}")
    public ResponseEntity<ApiResponse<List<Batch>>> getBatchesByProgram(@PathVariable("programId") Long programId) {
        return ResponseEntity.ok(ApiResponse.success(batchService.getBatchesByProgram(programId)));
    }

    @PostMapping
    @PreAuthorize("hasRole(\'ADMIN\')")
    public ResponseEntity<ApiResponse<Batch>> createBatch(@Valid @RequestBody BatchRequest request) {
        Batch created = batchService.createBatch(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Batch created successfully", created));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole(\'ADMIN\')")
    public ResponseEntity<ApiResponse<Batch>> updateBatch(@PathVariable("id") Long id, @Valid @RequestBody BatchRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Batch updated", batchService.updateBatch(id, request)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole(\'ADMIN\')")
    public ResponseEntity<ApiResponse<Void>> deleteBatch(@PathVariable("id") Long id) {
        batchService.deleteBatch(id);
        return ResponseEntity.ok(ApiResponse.success("Batch deleted", null));
    }

    public BatchController(final BatchService batchService) {
        this.batchService = batchService;
    }
}
