package com.admitconsult.repository;

import com.admitconsult.entity.PostLike;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PostLikeRepository extends JpaRepository<PostLike, PostLike.PostLikeId> {
    Optional<PostLike> findByPostIdAndUserId(String postId, String userId);
    List<PostLike> findByPostId(String postId);
    void deleteByPostIdAndUserId(String postId, String userId);
}