package com.admitconsult.repository;

import com.admitconsult.entity.PersonalityQuiz;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PersonalityQuizRepository extends JpaRepository<PersonalityQuiz, String> {
    Optional<PersonalityQuiz> findByStudentId(String studentId);
}