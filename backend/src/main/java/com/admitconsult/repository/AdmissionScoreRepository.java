package com.admitconsult.repository;

import com.admitconsult.entity.AdmissionScore;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AdmissionScoreRepository extends JpaRepository<AdmissionScore, String> {
    List<AdmissionScore> findByMajorIdAndYear(String majorId, Integer year);
    List<AdmissionScore> findByMajorId(String majorId);
    List<AdmissionScore> findByMajor_University_Id(String universityId);
}