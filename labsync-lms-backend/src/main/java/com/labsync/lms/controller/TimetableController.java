package com.labsync.lms.controller;

import com.labsync.lms.dto.response.ApiResponse;
import com.labsync.lms.dto.response.ScheduleResponse;
import com.labsync.lms.service.TimetableService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

/**
 * TimetableController — read-only timetable display endpoints.
 *
 * Base URL: /timetable
 *
 * Endpoints:
 *   GET /timetable/batch/{id}   — full week timetable for a batch (grouped by day)
 *   GET /timetable/day/{id}     — all sessions on a specific day
 *
 * Sample response for /timetable/batch/1:
 * {
 *   "success": true,
 *   "data": {
 *     "Monday": [
 *       { "scheduleId": 1, "batchName": "SE-A", "subjectName": "OS Lab",
 *         "staffName": "Dr. Patil", "labName": "Lab-101",
 *         "startTime": "08:00", "endTime": "10:00" }
 *     ],
 *     "Wednesday": [ ... ]
 *   }
 * }
 */
@RestController
@RequestMapping("/timetable")
public class TimetableController {
    private final TimetableService timetableService;

    /**
     * GET /timetable/batch/{batchId}
     * Returns the weekly timetable for a batch, organised as a map of day → sessions.
     */
    @GetMapping("/batch/{batchId}")
    public ResponseEntity<ApiResponse<Map<String, List<ScheduleResponse>>>> getTimetableByBatch(@PathVariable("batchId") Long batchId) {
        Map<String, List<ScheduleResponse>> timetable = timetableService.getTimetableByBatch(batchId);
        return ResponseEntity.ok(ApiResponse.success("Timetable fetched for batch id=" + batchId, timetable));
    }

    /**
     * GET /timetable/day/{dayId}
     * Returns all sessions scheduled for a specific day (across all batches).
     */
    @GetMapping("/day/{dayId}")
    public ResponseEntity<ApiResponse<List<ScheduleResponse>>> getTimetableByDay(@PathVariable("dayId") Long dayId) {
        return ResponseEntity.ok(ApiResponse.success(timetableService.getTimetableByDay(dayId)));
    }

    public TimetableController(final TimetableService timetableService) {
        this.timetableService = timetableService;
    }
}
