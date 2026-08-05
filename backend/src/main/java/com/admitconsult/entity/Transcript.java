package com.admitconsult.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "transcripts", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"student_id", "semester", "year"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Transcript {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(name = "student_id", nullable = false)
    private String studentId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TranscriptSemester semester;

    @Column(nullable = false)
    private Integer year;

    @Column(nullable = false, columnDefinition = "text")
    private String scores;

    @Column(name = "avg_score", precision = 10, scale = 2)
    private BigDecimal avgScore;

    @Column(name = "is_draft")
    @Builder.Default
    private Boolean isDraft = false;

    @Column(name = "image_url")
    private String imageUrl;

    @Column(name = "ocr_text", columnDefinition = "text")
    private String ocrText;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", insertable = false, updatable = false)
    private User student;

    public enum TranscriptSemester { HK1_L12, HK2_L12, GRADUATION_EXAM }
}