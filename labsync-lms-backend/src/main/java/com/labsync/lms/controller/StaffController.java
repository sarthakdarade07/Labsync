package com.labsync.lms.controller;

import com.labsync.lms.dto.request.StaffRequest;
import com.labsync.lms.dto.response.ApiResponse;
import com.labsync.lms.model.Staff;
import com.labsync.lms.service.StaffService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/staff")
public class StaffController {

    private final StaffService staffService;

    public StaffController(StaffService staffService) {
        this.staffService = staffService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<Staff>>> getAllStaff() {
        return ResponseEntity.ok(ApiResponse.success("Staff retrieved successfully", staffService.getAllStaff()));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Staff>> createStaff(@Valid @RequestBody StaffRequest request) {
        Staff created = staffService.createStaff(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Staff created successfully", created));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Staff>> updateStaff(@PathVariable Long id, @Valid @RequestBody StaffRequest request) {
        Staff updated = staffService.updateStaff(id, request);
        return ResponseEntity.ok(ApiResponse.success("Staff updated successfully", updated));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteStaff(@PathVariable Long id) {
        staffService.deleteStaff(id);
        return ResponseEntity.ok(ApiResponse.success("Staff deleted successfully", null));
    }
}
