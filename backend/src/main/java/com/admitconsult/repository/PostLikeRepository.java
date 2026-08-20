package com.admitconsult.repository;

import com.admitconsult.entity.PostLike;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Repository
public interface PostLikeRepository extends JpaRepository<PostLike, PostLike.PostLikeId> {
    Optional<PostLike> findByPostIdAndUserId(String postId, String userId);
    List<PostLike> findByPostId(String postId);

    @Transactional
    void deleteByPostIdAndUserId(String postId, String userId);
}