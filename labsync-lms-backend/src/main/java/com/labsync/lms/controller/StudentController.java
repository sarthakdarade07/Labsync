package com.labsync.lms.controller;

import com.labsync.lms.dto.request.StudentRequest;
import com.labsync.lms.dto.response.ApiResponse;
import com.labsync.lms.model.Student;
import com.labsync.lms.service.StudentService;
import jakarta.validation.Valid;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

/**
 * StudentController — CRUD endpoints for Student management.
 *
 * Base URL: /students
 *
 * Endpoints:
 *   GET    /students              — list all students (ADMIN, STAFF)
 *   GET    /students/{id}         — get by id
 *   GET    /students/prn/{prn}    — get by PRN
 *   GET    /students/batch/{id}   — list students in a batch
 *   POST   /students              — create student (ADMIN)
 *   PUT    /students/{id}         — update student (ADMIN)
 *   DELETE /students/{id}         — delete student (ADMIN)
 *
 * Sample create request:
 * {
 *   "fullName": "Rohan Sharma",
 *   "prn": "22CS001",
 *   "email": "rohan@college.edu",
 *   "phone": "9876543210",
 *   "batchId": 1,
 *   "programId": 1,
 *   "academicYearId": 1
 * }
 */
@RestController
@RequestMapping("/students")
public class StudentController {
    private final StudentService studentService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Student>>> getAllStudents() {
        return ResponseEntity.ok(ApiResponse.success(studentService.getAllStudents()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Student>> getStudentById(@PathVariable("id") Long id) {
        return ResponseEntity.ok(ApiResponse.success(studentService.getStudentById(id)));
    }

    @GetMapping("/prn/{prn}")
    public ResponseEntity<ApiResponse<Student>> getStudentByPrn(@PathVariable("prn") String prn) {
        return ResponseEntity.ok(ApiResponse.success(studentService.getStudentByPrn(prn)));
    }

    @GetMapping("/batch/{batchId}")
    public ResponseEntity<ApiResponse<List<Student>>> getStudentsByBatch(@PathVariable("batchId") Long batchId) {
        return ResponseEntity.ok(ApiResponse.success(studentService.getStudentsByBatch(batchId)));
    }

    @PostMapping
    @PreAuthorize("hasRole(\'ADMIN\')")
    public ResponseEntity<ApiResponse<Student>> createStudent(@Valid @RequestBody StudentRequest request) {
        Student created = studentService.createStudent(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Student created successfully", created));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole(\'ADMIN\')")
    public ResponseEntity<ApiResponse<Student>> updateStudent(@PathVariable("id") Long id, @Valid @RequestBody StudentRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Student updated", studentService.updateStudent(id, request)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole(\'ADMIN\')")
    public ResponseEntity<ApiResponse<Void>> deleteStudent(@PathVariable("id") Long id) {
        studentService.deleteStudent(id);
        return ResponseEntity.ok(ApiResponse.success("Student deleted", null));
    }

    public StudentController(final StudentService studentService) {
        this.studentService = studentService;
    }
}
