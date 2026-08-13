package com.admitconsult.dto;

import com.admitconsult.entity.Transcript;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SaveTranscriptRequest {

    @NotNull(message = "Semester is required")
    private Transcript.TranscriptSemester semester;

    @NotNull(message = "Year is required")
    private Integer year;

    @NotNull(message = "Scores payload is required")
    private String scores;

    private BigDecimal avgScore;

    @Builder.Default
    private Boolean isDraft = false;

    private String imageUrl;

    private String ocrText;
}
