package com.admitconsult.repository;

import com.admitconsult.entity.MajorCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface MajorCategoryRepository extends JpaRepository<MajorCategory, String> {
    Optional<MajorCategory> findBySlug(String slug);
}