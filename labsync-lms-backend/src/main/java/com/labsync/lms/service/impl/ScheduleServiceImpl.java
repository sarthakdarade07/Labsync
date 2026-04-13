package com.labsync.lms.service.impl;

import com.labsync.lms.dto.request.ScheduleRequest;
import com.labsync.lms.dto.response.ClashReport;
import com.labsync.lms.dto.response.ScheduleResponse;
import com.labsync.lms.exception.ResourceNotFoundException;
import com.labsync.lms.exception.ScheduleClashException;
import com.labsync.lms.model.*;
import com.labsync.lms.repository.*;
import com.labsync.lms.service.ScheduleService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * ScheduleServiceImpl — core scheduling engine.
 *
 * Clash detection rules enforced on every create/update:
 *  1. Lab is not already booked for this day + slot
 *  2. Staff member is not double-booked for this day + slot
 *  3. Batch is not already assigned for this day + slot
 *  4. Lab capacity (workingComputers) >= batch studentCount
 */
@Service
public class ScheduleServiceImpl implements ScheduleService {
    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(ScheduleServiceImpl.class);
    private final ScheduleRepository scheduleRepository;
    private final BatchRepository batchRepository;
    private final SubjectRepository subjectRepository;
    private final StaffRepository staffRepository;
    private final LabRepository labRepository;
    private final DayRepository dayRepository;
    private final TimeSlotRepository timeSlotRepository;

    // ── Create ────────────────────────────────────────────────────────────────
    @Override
    @Transactional
    public Schedule createSchedule(ScheduleRequest req) {
        ClashReport report = validateSchedule(req);
        if (report.isHasClash()) {
            throw new ScheduleClashException(report.getClashMessages());
        }
        Schedule schedule = buildSchedule(req);
        Schedule saved = scheduleRepository.save(schedule);
        log.info("Schedule created: id={}, batch={}, lab={}, day={}, time={}-{}", saved.getId(), saved.getBatch().getBatchName(), saved.getLab().getLabName(), saved.getDay().getDayName(), saved.getStartTime(), saved.getEndTime());
        return saved;
    }

    // ── Update ────────────────────────────────────────────────────────────────
    @Override
    @Transactional
    public Schedule updateSchedule(Long id, ScheduleRequest req) {
        Schedule existing = getScheduleById(id);
        // Validate while excluding self (avoids false self-clash)
        ClashReport report = validateSchedule(req, id);
        if (report.isHasClash()) {
            throw new ScheduleClashException(report.getClashMessages());
        }
        existing.setBatch(fetchBatch(req.getBatchId()));
        existing.setSubject(fetchSubject(req.getSubjectId()));
        existing.setStaff(req.getStaffId() != null ? fetchStaff(req.getStaffId()) : null);
        existing.setLab(fetchLab(req.getLabId()));
        existing.setDay(fetchDay(req.getDayId()));
        existing.setStartTime(java.time.LocalTime.parse(req.getStartTime()));
        existing.setEndTime(java.time.LocalTime.parse(req.getEndTime()));
        return scheduleRepository.save(existing);
    }

    // ── Delete ────────────────────────────────────────────────────────────────
    @Override
    @Transactional
    public void deleteSchedule(Long id) {
        Schedule schedule = getScheduleById(id);
        schedule.setActive(false);
        scheduleRepository.save(schedule);
        log.info("Deactivated schedule id={}", id);
    }

    // ── Read ──────────────────────────────────────────────────────────────────
    @Override
    @Transactional(readOnly = true)
    public List<ScheduleResponse> getAllSchedules() {
        return scheduleRepository.findAll().stream().filter(Schedule::isActive).map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Schedule getScheduleById(Long id) {
        return scheduleRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Schedule", "id", id));
    }

    @Override
    @Transactional(readOnly = true)
    public List<ScheduleResponse> getSchedulesByBatch(Long batchId) {
        return scheduleRepository.findTimetableByBatch(batchId).stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ScheduleResponse> getSchedulesByDay(Long dayId) {
        return scheduleRepository.findTimetableByDay(dayId).stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ScheduleResponse> getSchedulesByLab(Long labId) {
        return scheduleRepository.findByLabIdAndActiveTrue(labId).stream().map(this::toResponse).collect(Collectors.toList());
    }

    // ── Clash Detection ───────────────────────────────────────────────────────
    /**
     * Validates a schedule request against 4 constraints.
     * Returns a ClashReport listing every detected conflict.
     * Does NOT throw — callers decide how to handle clashes.
     */
    @Override
    @Transactional(readOnly = true)
    public ClashReport validateSchedule(ScheduleRequest req) {
        return validateSchedule(req, null);
    }

    /**
     * Same as validateSchedule but ignores the schedule with {@code excludeId}
     * (used for update operations to avoid self-clash).
     */
    @Override
    @Transactional(readOnly = true)
    public ClashReport validateSchedule(ScheduleRequest req, Long excludeScheduleId) {
        List<String> clashes = new ArrayList<>();
        Batch batch = fetchBatch(req.getBatchId());
        Lab lab = fetchLab(req.getLabId());
        Staff staff = req.getStaffId() != null ? fetchStaff(req.getStaffId()) : null;
        Long dayId = req.getDayId();
        java.time.LocalTime start = java.time.LocalTime.parse(req.getStartTime());
        java.time.LocalTime end = java.time.LocalTime.parse(req.getEndTime());

        // ── Rule 1: Lab double-booking ────────────────────────────────────────
        if (scheduleRepository.hasLabClash(lab.getId(), dayId, start, end, excludeScheduleId)) {
            clashes.add(String.format("Lab '%s' is already booked on %s at this time", lab.getLabName(), fetchDay(dayId).getDayName()));
        }
        // ── Rule 2: Staff double-booking ──────────────────────────────────────
        if (staff != null && scheduleRepository.hasStaffClash(staff.getId(), dayId, start, end, excludeScheduleId)) {
            clashes.add(String.format("Staff '%s' is already assigned on %s at this time", staff.getFullName(), fetchDay(dayId).getDayName()));
        }
        // ── Rule 3: Batch double-booking ──────────────────────────────────────
        if (scheduleRepository.hasBatchClash(batch.getId(), dayId, start, end, excludeScheduleId)) {
            clashes.add(String.format("Batch '%s' already has a session on %s at this time", batch.getBatchName(), fetchDay(dayId).getDayName()));
        }
        // ── Rule 4: Lab capacity check ────────────────────────────────────────
        if (lab.getWorkingComputers() < batch.getStudentCount()) {
            clashes.add(String.format("Lab '%s' has only %d working computers but batch '%s' has %d students", lab.getLabName(), lab.getWorkingComputers(), batch.getBatchName(), batch.getStudentCount()));
        }
        return clashes.isEmpty() ? ClashReport.noClash() : ClashReport.withClashes(clashes);
    }

    // ── DTO Mapping ───────────────────────────────────────────────────────────
    @Override
    public ScheduleResponse toResponse(Schedule s) {
        return ScheduleResponse.builder().scheduleId(s.getId()).batchId(s.getBatch().getId()).batchName(s.getBatch().getBatchName()).division(s.getBatch().getDivision()).subjectId(s.getSubject().getId()).subjectName(s.getSubject().getName()).subjectCode(s.getSubject().getSubjectCode()).staffId(s.getStaff() != null ? s.getStaff().getId() : null).staffName(s.getStaff() != null ? s.getStaff().getFullName() : "No Faculty").labId(s.getLab().getId()).labName(s.getLab().getLabName()).dayId(s.getDay().getId()).dayName(s.getDay().getDayName()).dayOrder(s.getDay().getDayOrder()).slotLabel(s.getStartTime() + " - " + s.getEndTime()).startTime(s.getStartTime()).endTime(s.getEndTime()).generatedByGA(s.isGeneratedByGA()).build();
    }

    // ── Internal Helpers ──────────────────────────────────────────────────────
    private Schedule buildSchedule(ScheduleRequest req) {
        return Schedule.builder().batch(fetchBatch(req.getBatchId())).subject(fetchSubject(req.getSubjectId())).staff(req.getStaffId() != null ? fetchStaff(req.getStaffId()) : null).lab(fetchLab(req.getLabId())).day(fetchDay(req.getDayId())).startTime(java.time.LocalTime.parse(req.getStartTime())).endTime(java.time.LocalTime.parse(req.getEndTime())).active(true).generatedByGA(false).build();
    }



    private Batch fetchBatch(Long id) {
        return batchRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Batch", "id", id));
    }

    private Subject fetchSubject(Long id) {
        return subjectRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Subject", "id", id));
    }

    private Staff fetchStaff(Long id) {
        return staffRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Staff", "id", id));
    }

    private Lab fetchLab(Long id) {
        return labRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Lab", "id", id));
    }

    private Day fetchDay(Long id) {
        return dayRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Day", "id", id));
    }


    public ScheduleServiceImpl(final ScheduleRepository scheduleRepository, final BatchRepository batchRepository, final SubjectRepository subjectRepository, final StaffRepository staffRepository, final LabRepository labRepository, final DayRepository dayRepository, final TimeSlotRepository timeSlotRepository) {
        this.scheduleRepository = scheduleRepository;
        this.batchRepository = batchRepository;
        this.subjectRepository = subjectRepository;
        this.staffRepository = staffRepository;
        this.labRepository = labRepository;
        this.dayRepository = dayRepository;
        this.timeSlotRepository = timeSlotRepository;
    }
}
