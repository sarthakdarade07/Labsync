package com.labsync.lms.service;

import com.labsync.lms.dto.request.StaffRequest;
import com.labsync.lms.model.Staff;
import java.util.List;

public interface StaffService {
    List<Staff> getAllStaff();
    Staff createStaff(StaffRequest request);
    Staff updateStaff(Long id, StaffRequest request);
    void deleteStaff(Long id);
}
