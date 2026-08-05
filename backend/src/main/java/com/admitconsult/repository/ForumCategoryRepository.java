package com.admitconsult.repository;

import com.admitconsult.entity.ForumCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ForumCategoryRepository extends JpaRepository<ForumCategory, String> {
    Optional<ForumCategory> findBySlug(String slug);
}