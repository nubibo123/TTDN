package com.admitconsult.repository;

import com.admitconsult.entity.Transcript;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TranscriptRepository extends JpaRepository<Transcript, String> {
    List<Transcript> findByStudentId(String studentId);
    List<Transcript> findByStudentIdOrderByYearAsc(String studentId);
    Optional<Transcript> findByStudentIdAndSemesterAndYear(String studentId, Transcript.TranscriptSemester semester, Integer year);
    Optional<Transcript> findByIdAndStudentId(String id, String studentId);
}