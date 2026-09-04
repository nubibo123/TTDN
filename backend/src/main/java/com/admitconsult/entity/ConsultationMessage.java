package com.admitconsult.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "consultation_messages")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ConsultationMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(name = "consultation_id", nullable = false)
    private String consultationId;

    @Column(name = "sender_id", nullable = false)
    private String senderId;

    @Column(nullable = false, columnDefinition = "text")
    private String content;

    @Column(name = "is_official")
    @Builder.Default
    private Boolean isOfficial = false;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @com.fasterxml.jackson.annotation.JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "consultation_id", insertable = false, updatable = false)
    private Consultation consultation;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "sender_id", insertable = false, updatable = false)
    private User sender;
}