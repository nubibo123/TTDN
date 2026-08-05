package com.admitconsult.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AdmissionScoreDto {
    private String id;
    private String majorId;
    private String majorName;
    private String universityId;
    private String universityName;
    private Integer year;
    private String method;
    private BigDecimal score;
    private String note;
    private String url;
}