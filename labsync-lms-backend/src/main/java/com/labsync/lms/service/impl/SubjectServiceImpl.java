package com.labsync.lms.service.impl;

import com.labsync.lms.dto.request.SubjectRequest;
import com.labsync.lms.model.Subject;
import com.labsync.lms.repository.SubjectRepository;
import com.labsync.lms.service.SubjectService;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class SubjectServiceImpl implements SubjectService {
    private final SubjectRepository subjectRepository;

    public SubjectServiceImpl(SubjectRepository subjectRepository) {
        this.subjectRepository = subjectRepository;
    }

    @Override
    public List<Subject> getAllSubjects() {
        return subjectRepository.findAll();
    }

    @Override
    public Subject createSubject(SubjectRequest request) {
        Subject subject = Subject.builder()
            .name(request.getName())
            .subjectCode(request.getSubjectCode())
            .description(request.getDescription())
            .hoursPerWeek(request.getHoursPerWeek())
            .build();
        return subjectRepository.save(subject);
    }

    @Override
    public Subject updateSubject(Long id, SubjectRequest request) {
        Subject existing = subjectRepository.findById(id)
            .orElseThrow(() -> new com.labsync.lms.exception.ResourceNotFoundException("Subject", "id", id));
        existing.setName(request.getName());
        existing.setSubjectCode(request.getSubjectCode());
        existing.setDescription(request.getDescription());
        existing.setHoursPerWeek(request.getHoursPerWeek());
        return subjectRepository.save(existing);
    }

    @Override
    public void deleteSubject(Long id) {
        Subject existing = subjectRepository.findById(id)
            .orElseThrow(() -> new com.labsync.lms.exception.ResourceNotFoundException("Subject", "id", id));
        subjectRepository.delete(existing);
    }
}
