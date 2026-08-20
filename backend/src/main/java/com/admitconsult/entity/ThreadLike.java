package com.admitconsult.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.io.Serializable;
import java.time.LocalDateTime;

@Entity
@Table(name = "forum_thread_likes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@IdClass(ThreadLike.ThreadLikeId.class)
public class ThreadLike {

    @Id
    @Column(name = "thread_id")
    private String threadId;

    @Id
    @Column(name = "user_id")
    private String userId;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "thread_id", insertable = false, updatable = false)
    private ForumThread thread;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", insertable = false, updatable = false)
    private User user;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ThreadLikeId implements Serializable {
        private String threadId;
        private String userId;
    }
}