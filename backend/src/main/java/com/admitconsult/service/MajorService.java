package com.admitconsult.service;

import com.admitconsult.entity.Major;
import com.admitconsult.repository.MajorRepository;
import com.admitconsult.repository.UniversityRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class MajorService {

    private final MajorRepository majorRepository;
    private final UniversityRepository universityRepository;

    public List<Major> getAllMajors() {
        return majorRepository.findAll();
    }

    public List<Major> getAllMajorsByUniversityId(String id) {
        return majorRepository.findByUniversityId(id);
    }

    public Major getMajorById(String id) {
        return majorRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Major with id " + id + " not found"));
    }

    public Major createMajor(Major major) {

        // Kiểm tra university có tồn tại không
        universityRepository.findById(major.getUniversity().getId())
                .orElseThrow(() ->
                        new RuntimeException(
                                "University with id " + major.getUniversity().getId() + " not found"
                        ));

        return majorRepository.save(major);
    }
}