package com.admitconsult.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MajorDto {
    private String id;
    private String universityId;
    private String universityName;
    private String code;
    private String name;
    private String subjectGroup;
    private String description;
    private BigDecimal tuitionMin;
    private BigDecimal tuitionMax;
    private String[] careerPaths;
    private Boolean isActive;
    private String categoryId;
    private String categoryName;
}