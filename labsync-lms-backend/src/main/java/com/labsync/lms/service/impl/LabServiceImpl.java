package com.labsync.lms.service.impl;

import com.labsync.lms.dto.request.ComputerStatusRequest;
import com.labsync.lms.dto.request.LabRequest;
import com.labsync.lms.dto.response.LabAvailabilityResponse;
import com.labsync.lms.exception.DuplicateResourceException;
import com.labsync.lms.exception.ResourceNotFoundException;
import com.labsync.lms.model.Lab;
import com.labsync.lms.repository.LabRepository;
import com.labsync.lms.service.LabService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.stream.Collectors;

/**
 * LabServiceImpl — manages Lab CRUD and real-time computer availability tracking.
 *
 * Business rules enforced:
 *  - workingComputers + faultyComputers <= totalComputers
 *  - labName must be unique
 */
@Service
public class LabServiceImpl implements LabService {
    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(LabServiceImpl.class);
    private final LabRepository labRepository;

    // ── CRUD ─────────────────────────────────────────────────────────────────
    @Override
    @Transactional
    public Lab createLab(LabRequest req) {
        labRepository.findByLabName(req.getLabName()).ifPresent(l -> {
            throw new DuplicateResourceException("Lab with name \'" + req.getLabName() + "\' already exists");
        });
        int working = req.getWorkingComputers() != null ? req.getWorkingComputers() : req.getTotalComputers();
        int faulty = req.getFaultyComputers() != null ? req.getFaultyComputers() : 0;
        validateComputerCounts(req.getTotalComputers(), working, faulty);
        Lab lab = Lab.builder().labName(req.getLabName()).capacity(req.getCapacity()).totalComputers(req.getTotalComputers()).workingComputers(working).faultyComputers(faulty).osType(req.getOsType()).location(req.getLocation()).available(req.getAvailable() != null ? req.getAvailable() : true).build();
        Lab saved = labRepository.save(lab);
        log.info("Created lab: {} (id={})", saved.getLabName(), saved.getId());
        return saved;
    }

    @Override
    @Transactional
    public Lab updateLab(Long id, LabRequest req) {
        Lab existing = getLabById(id);
        // Check name uniqueness only if it changed
        if (!existing.getLabName().equals(req.getLabName())) {
            labRepository.findByLabName(req.getLabName()).ifPresent(l -> {
                throw new DuplicateResourceException("Lab name \'" + req.getLabName() + "\' is already taken");
            });
        }
        int working = req.getWorkingComputers() != null ? req.getWorkingComputers() : existing.getWorkingComputers();
        int faulty = req.getFaultyComputers() != null ? req.getFaultyComputers() : existing.getFaultyComputers();
        validateComputerCounts(req.getTotalComputers(), working, faulty);
        existing.setLabName(req.getLabName());
        existing.setCapacity(req.getCapacity());
        existing.setTotalComputers(req.getTotalComputers());
        existing.setWorkingComputers(working);
        existing.setFaultyComputers(faulty);
        existing.setOsType(req.getOsType());
        existing.setLocation(req.getLocation());
        if (req.getAvailable() != null) existing.setAvailable(req.getAvailable());
        return labRepository.save(existing);
    }

    @Override
    @Transactional(readOnly = true)
    public Lab getLabById(Long id) {
        return labRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Lab", "id", id));
    }

    @Override
    @Transactional(readOnly = true)
    public List<Lab> getAllLabs() {
        return labRepository.findAll();
    }

    @Override
    @Transactional
    public void deleteLab(Long id) {
        labRepository.delete(getLabById(id));
        log.info("Deleted lab id={}", id);
    }

    // ── Computer Status ──────────────────────────────────────────────────────
    /**
     * Updates working/faulty computer counts for a lab.
     * Triggers dashboard refresh on next availability fetch.
     */
    @Override
    @Transactional
    public Lab updateComputerStatus(Long id, ComputerStatusRequest req) {
        Lab lab = getLabById(id);
        validateComputerCounts(lab.getTotalComputers(), req.getWorkingComputers(), req.getFaultyComputers());
        lab.setWorkingComputers(req.getWorkingComputers());
        lab.setFaultyComputers(req.getFaultyComputers());
        Lab updated = labRepository.save(lab);
        log.info("Updated computer status for lab \'{}\': working={}, faulty={}", lab.getLabName(), req.getWorkingComputers(), req.getFaultyComputers());
        return updated;
    }

    // ── Availability Dashboard ────────────────────────────────────────────────
    @Override
    @Transactional(readOnly = true)
    public List<LabAvailabilityResponse> getAllLabAvailability() {
        return labRepository.findAll().stream().map(this::toAvailabilityResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public LabAvailabilityResponse getLabAvailability(Long id) {
        return toAvailabilityResponse(getLabById(id));
    }

    @Override
    @Transactional(readOnly = true)
    public List<Lab> searchAvailableLabs(Long dayId, String startTime, String endTime, Integer requiredComputers, String osType) {
        java.time.LocalTime start = java.time.LocalTime.parse(startTime);
        java.time.LocalTime end = java.time.LocalTime.parse(endTime);
        int reqComps = requiredComputers != null ? requiredComputers : 1;
        String reqOs = (osType != null && !osType.equalsIgnoreCase("Any") && !osType.trim().isEmpty()) ? osType : "";
        return labRepository.findAvailableLabsForSession(dayId, start, end, reqComps, reqOs);
    }

    // ── Mapping helpers ───────────────────────────────────────────────────────
    private LabAvailabilityResponse toAvailabilityResponse(Lab lab) {
        int maintenance = lab.getTotalComputers() - lab.getWorkingComputers() - lab.getFaultyComputers();
        double availabilityPct = lab.getTotalComputers() > 0 ? (lab.getWorkingComputers() * 100.0) / lab.getTotalComputers() : 0.0;
        return LabAvailabilityResponse.builder().labId(lab.getId()).labName(lab.getLabName()).location(lab.getLocation()).osType(lab.getOsType()).capacity(lab.getCapacity()).totalComputers(lab.getTotalComputers()).workingComputers(lab.getWorkingComputers()).faultyComputers(lab.getFaultyComputers()).underMaintenanceComputers(Math.max(maintenance, 0)).available(lab.isAvailable()).availabilityPercentage(Math.round(availabilityPct * 10.0) / 10.0).build();
    }

    // ── Validation ────────────────────────────────────────────────────────────
    private void validateComputerCounts(int total, int working, int faulty) {
        if (working + faulty > total) {
            throw new IllegalArgumentException(String.format("working (%d) + faulty (%d) cannot exceed total (%d)", working, faulty, total));
        }
        if (working < 0 || faulty < 0) {
            throw new IllegalArgumentException("Computer counts cannot be negative");
        }
    }

    public LabServiceImpl(final LabRepository labRepository) {
        this.labRepository = labRepository;
    }
}
