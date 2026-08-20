package com.admitconsult.service;

import com.admitconsult.dto.UserPrincipal;
import com.admitconsult.entity.StudentProfile;
import com.admitconsult.repository.StudentProfileRepository;
import com.admitconsult.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class StudentProfileService {

    private final StudentProfileRepository studentProfileRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public Optional<StudentProfile> findByUserId(String userId) {
        return studentProfileRepository.findByUserId(userId);
    }

    @Transactional
    public StudentProfile getOrCreateForUser(UserPrincipal principal) {
        return studentProfileRepository.findByUserId(principal.getId())
                .orElseGet(() -> {
                    StudentProfile profile = StudentProfile.builder()
                            .userId(principal.getId())
                            .build();
                    return studentProfileRepository.save(profile);
                });
    }

    @Transactional
    public StudentProfile update(StudentProfile existing, StudentProfile updates) {
        existing.setGraduationYear(updates.getGraduationYear());
        existing.setProvince(updates.getProvince());
        existing.setIsProfilePublic(updates.getIsProfilePublic());
        existing.setShowGrades(updates.getShowGrades());
        existing.setAllowContact(updates.getAllowContact());
        existing.setShowInForum(updates.getShowInForum());
        return studentProfileRepository.save(existing);
    }
}
