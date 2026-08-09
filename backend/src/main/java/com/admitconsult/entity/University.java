package com.admitconsult.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "universities")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class University {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(unique = true, nullable = false)
    private String code;

    @Column(nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private UniversityRegion region = UniversityRegion.NORTH;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private UniversityType type = UniversityType.PUBLIC;

    private String address;

    @Column(name = "website_url")
    private String websiteUrl;
    @Column(name = "tuition_range", columnDefinition = "text")
    private String tuitionRange;
    @Column(name = "is_verified")
    @Builder.Default
    private Boolean isVerified = false;

    @Column(name = "dean_url", columnDefinition = "text")
    private String deanUrl;

    @Column(precision = 10, scale = 7)
    private BigDecimal latitude;

    @Column(precision = 10, scale = 7)
    private BigDecimal longitude;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    public enum UniversityRegion { NORTH, CENTRAL, SOUTH }
    public enum UniversityType { PUBLIC, PRIVATE, NATIONAL, INTERNATIONAL }
}