package com.admitconsult.repository;

import com.admitconsult.entity.AcademicYear;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AcademicYearRepository extends JpaRepository<AcademicYear, String> {
    Optional<AcademicYear> findByYear(String year);
    List<AcademicYear> findByIsActiveTrueOrderByYearDesc();
}
