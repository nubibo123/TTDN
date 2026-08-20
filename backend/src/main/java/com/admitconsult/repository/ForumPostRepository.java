package com.admitconsult.repository;

import com.admitconsult.entity.ForumPost;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ForumPostRepository extends JpaRepository<ForumPost, String> {
    List<ForumPost> findByThreadIdOrderByCreatedAtAsc(String threadId);
    List<ForumPost> findByAuthorIdOrderByCreatedAtDesc(String authorId);
    List<ForumPost> findByParentIdOrderByCreatedAtAsc(String parentId);
    long countByThreadIdAndParentIdIsNull(String threadId);
}