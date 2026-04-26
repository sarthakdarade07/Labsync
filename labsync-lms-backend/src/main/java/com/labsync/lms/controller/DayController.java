package com.labsync.lms.controller;

import com.labsync.lms.dto.response.ApiResponse;
import com.labsync.lms.model.Day;
import com.labsync.lms.repository.DayRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.security.access.prepost.PreAuthorize;

import java.util.List;

@RestController
@RequestMapping("/days")
public class DayController {
    private final DayRepository dayRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Day>>> getAllDays() {
        return ResponseEntity.ok(ApiResponse.success(dayRepository.findAll()));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Day>> updateDay(@PathVariable("id") Long id, @RequestBody Day updateDto) {
        Day day = dayRepository.findById(id).orElseThrow(() -> new RuntimeException("Day not found"));
        day.setStartTime(updateDto.getStartTime());
        day.setEndTime(updateDto.getEndTime());
        day.setActive(updateDto.isActive());
        return ResponseEntity.ok(ApiResponse.success("Day updated", dayRepository.save(day)));
    }

    @PutMapping("/bulk")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<Day>>> updateDaysBulk(@RequestBody List<Day> daysToUpdate) {
        for (Day updateDto : daysToUpdate) {
            Day day = dayRepository.findById(updateDto.getId()).orElse(null);
            if (day != null) {
                day.setStartTime(updateDto.getStartTime());
                day.setEndTime(updateDto.getEndTime());
                day.setActive(updateDto.isActive());
                dayRepository.save(day);
            }
        }
        return ResponseEntity.ok(ApiResponse.success("All days updated", dayRepository.findAll()));
    }

    public DayController(DayRepository dayRepository) {
        this.dayRepository = dayRepository;
    }
}
