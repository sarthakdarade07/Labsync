package com.labsync.lms.service;

import com.labsync.lms.dto.request.SubjectRequest;
import com.labsync.lms.model.Subject;
import java.util.List;

public interface SubjectService {
    List<Subject> getAllSubjects();
    Subject createSubject(SubjectRequest request);
    Subject updateSubject(Long id, SubjectRequest request);
    void deleteSubject(Long id);
}
