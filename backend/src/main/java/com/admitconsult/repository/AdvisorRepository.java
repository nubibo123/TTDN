package com.admitconsult.repository;

import com.admitconsult.entity.Advisor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AdvisorRepository extends JpaRepository<Advisor, String> {
    Optional<Advisor> findByUserId(String userId);
}