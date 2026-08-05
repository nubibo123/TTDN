package com.admitconsult.repository;

import com.admitconsult.entity.Major;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MajorRepository extends JpaRepository<Major, String> {
    List<Major> findByUniversityId(String universityId);
    List<Major> findBySubjectGroup(String subjectGroup);
}