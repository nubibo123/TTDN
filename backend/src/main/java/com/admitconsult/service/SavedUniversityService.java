package com.admitconsult.service;

import com.admitconsult.entity.SavedUniversity;
import com.admitconsult.entity.University;
import com.admitconsult.repository.SavedUniversityRepository;
import com.admitconsult.repository.UniversityRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class SavedUniversityService {

    private final SavedUniversityRepository savedUniversityRepository;
    private final UniversityRepository universityRepository;

    @Transactional(readOnly = true)
    public List<University> getSavedUniversities(String studentId) {
        List<SavedUniversity> savedList = savedUniversityRepository.findByStudentIdOrderByCreatedAtDesc(studentId);
        List<String> uniIds = savedList.stream().map(SavedUniversity::getUniversityId).toList();
        return universityRepository.findAllById(uniIds);
    }

    @Transactional(readOnly = true)
    public List<String> getSavedUniversityIds(String studentId) {
        return savedUniversityRepository.findByStudentIdOrderByCreatedAtDesc(studentId)
                .stream()
                .map(SavedUniversity::getUniversityId)
                .toList();
    }

    @Transactional
    public boolean toggleSaveUniversity(String studentId, String universityId) {
        Optional<SavedUniversity> existing = savedUniversityRepository.findByStudentIdAndUniversityId(studentId, universityId);
        if (existing.isPresent()) {
            savedUniversityRepository.delete(existing.get());
            log.info("Student studentId={} un-saved universityId={}", studentId, universityId);
            return false;
        } else {
            SavedUniversity saved = SavedUniversity.builder()
                    .studentId(studentId)
                    .universityId(universityId)
                    .build();
            savedUniversityRepository.save(saved);
            log.info("Student studentId={} saved universityId={}", studentId, universityId);
            return true;
        }
    }

    @Transactional
    public void syncSavedUniversities(String studentId, List<String> universityIds) {
        if (universityIds == null || universityIds.isEmpty()) return;
        for (String uniId : universityIds) {
            if (!savedUniversityRepository.existsByStudentIdAndUniversityId(studentId, uniId)) {
                if (universityRepository.existsById(uniId)) {
                    savedUniversityRepository.save(SavedUniversity.builder()
                            .studentId(studentId)
                            .universityId(uniId)
                            .build());
                }
            }
        }
    }
}
