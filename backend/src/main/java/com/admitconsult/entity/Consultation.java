package com.admitconsult.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "consultations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Consultation {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(name = "student_id", nullable = false)
    private String studentId;

    @Column(name = "advisor_id")
    private String advisorId;

    @Column(nullable = false)
    private String topic;

    @Column(nullable = false, columnDefinition = "text")
    private String message;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private ConsultationMode mode = ConsultationMode.CHAT;

    @Column(name = "scheduled_time")
    private String scheduledTime;

    @Column(name = "contact_phone")
    private String contactPhone;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private ConsultationStatus status = ConsultationStatus.PENDING;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", insertable = false, updatable = false)
    private User student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "advisor_id", insertable = false, updatable = false)
    private Advisor advisor;

    @OneToMany(mappedBy = "consultation", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private Set<ConsultationMessage> messages = new HashSet<>();

    public enum ConsultationStatus { PENDING, ACCEPTED, COMPLETED, REJECTED }
    public enum ConsultationMode { CHAT, SCHEDULED_CALL }
}