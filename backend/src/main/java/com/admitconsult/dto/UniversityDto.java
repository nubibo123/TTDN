package com.admitconsult.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UniversityDto {
    private String id;
    private String code;
    private String name;
    private String region;
    private String type;
    private String address;
    private String websiteUrl;
    private String tuitionRange;
    private Boolean isVerified;
    private String deanUrl;
    private BigDecimal latitude;
    private BigDecimal longitude;
}