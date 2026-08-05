package com.admitconsult.repository;

import com.admitconsult.entity.ConsultationMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ConsultationMessageRepository extends JpaRepository<ConsultationMessage, String> {
    List<ConsultationMessage> findByConsultationIdOrderByCreatedAtAsc(String consultationId);
}