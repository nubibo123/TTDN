package com.admitconsult.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TranscriptDto {
    private String id;
    private String studentId;
    private String semester;
    private Integer year;
    private String scores;
    private BigDecimal avgScore;
    private Boolean isDraft;
}