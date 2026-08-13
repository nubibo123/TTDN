package com.admitconsult.dto;

import com.admitconsult.entity.Transcript;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TranscriptDto {
    private String id;
    private String studentId;
    private String semester;
    private Integer year;
    private String scores;
    private BigDecimal avgScore;
    private Boolean isDraft;
    private String imageUrl;
    private String ocrText;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static TranscriptDto fromEntity(Transcript transcript) {
        if (transcript == null) return null;
        return TranscriptDto.builder()
                .id(transcript.getId())
                .studentId(transcript.getStudentId())
                .semester(transcript.getSemester() != null ? transcript.getSemester().name() : null)
                .year(transcript.getYear())
                .scores(transcript.getScores())
                .avgScore(transcript.getAvgScore())
                .isDraft(transcript.getIsDraft())
                .imageUrl(transcript.getImageUrl())
                .ocrText(transcript.getOcrText())
                .createdAt(transcript.getCreatedAt())
                .updatedAt(transcript.getUpdatedAt())
                .build();
    }
}