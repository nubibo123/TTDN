package com.admitconsult.repository;

import com.admitconsult.entity.Consultation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ConsultationRepository extends JpaRepository<Consultation, String> {
    List<Consultation> findByStudentIdOrderByCreatedAtDesc(String studentId);
    List<Consultation> findByAdvisorIdOrderByCreatedAtDesc(String advisorId);
}