package com.admitconsult.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "majors", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"university_id", "code"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Major {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "university_id", nullable = false)
    private University university;

    @Column(nullable = false)
    private String code;

    @Column(nullable = false)
    private String name;

    @Column(name = "subject_group")
    private String subjectGroup;

    private String description;

    @Column(name = "tuition_min")
    private BigDecimal tuitionMin;

    @Column(name = "tuition_max")
    private BigDecimal tuitionMax;

    @Column(name = "career_paths", columnDefinition = "text[]")
    @Builder.Default
    private String[] careerPaths = {};

    @Builder.Default
    private Boolean isActive = true;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private MajorCategory category;

    @OneToMany(mappedBy = "major", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private Set<AdmissionScore> admissionScores = new HashSet<>();
}