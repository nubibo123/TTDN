package com.admitconsult.repository;

import com.admitconsult.entity.ThreadLike;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Repository
public interface ThreadLikeRepository extends JpaRepository<ThreadLike, ThreadLike.ThreadLikeId> {
    Optional<ThreadLike> findByThreadIdAndUserId(String threadId, String userId);

    @Transactional
    void deleteByThreadIdAndUserId(String threadId, String userId);
}