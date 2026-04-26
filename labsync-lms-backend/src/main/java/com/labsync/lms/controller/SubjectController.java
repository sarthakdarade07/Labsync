package com.labsync.lms.controller;

import com.labsync.lms.dto.request.SubjectRequest;
import com.labsync.lms.dto.response.ApiResponse;
import com.labsync.lms.model.Subject;
import com.labsync.lms.service.SubjectService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/subjects")
public class SubjectController {
    private final SubjectService subjectService;

    public SubjectController(SubjectService subjectService) {
        this.subjectService = subjectService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<Subject>>> getAllSubjects() {
        return ResponseEntity.ok(ApiResponse.success("Subjects retrieved successfully", subjectService.getAllSubjects()));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Subject>> createSubject(@Valid @RequestBody SubjectRequest request) {
        Subject created = subjectService.createSubject(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Subject created successfully", created));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Subject>> updateSubject(@PathVariable("id") Long id, @Valid @RequestBody SubjectRequest request) {
        Subject updated = subjectService.updateSubject(id, request);
        return ResponseEntity.ok(ApiResponse.success("Subject updated successfully", updated));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteSubject(@PathVariable("id") Long id) {
        subjectService.deleteSubject(id);
        return ResponseEntity.ok(ApiResponse.success("Subject deleted successfully", null));
    }
}
