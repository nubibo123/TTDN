package com.admitconsult.repository;

import com.admitconsult.entity.SavedUniversity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SavedUniversityRepository extends JpaRepository<SavedUniversity, String> {
    List<SavedUniversity> findByStudentIdOrderByCreatedAtDesc(String studentId);
    Optional<SavedUniversity> findByStudentIdAndUniversityId(String studentId, String universityId);
    boolean existsByStudentIdAndUniversityId(String studentId, String universityId);
    void deleteByStudentIdAndUniversityId(String studentId, String universityId);
}
