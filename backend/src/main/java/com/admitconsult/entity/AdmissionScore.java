package com.admitconsult.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "admission_scores", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"major_id", "year", "method"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdmissionScore {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "major_id", nullable = false)
    private Major major;

    @Column(nullable = false)
    private Integer year;

    @Column(nullable = false)
    @Builder.Default
    private String method = "Điểm thi THPT";

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal score;

    private String note;
    private String url;
}