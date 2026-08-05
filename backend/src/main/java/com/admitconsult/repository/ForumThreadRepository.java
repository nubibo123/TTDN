package com.admitconsult.repository;

import com.admitconsult.entity.ForumThread;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ForumThreadRepository extends JpaRepository<ForumThread, String> {
    List<ForumThread> findByCategoryIdOrderByCreatedAtDesc(String categoryId);
    List<ForumThread> findByAuthorIdOrderByCreatedAtDesc(String authorId);
}