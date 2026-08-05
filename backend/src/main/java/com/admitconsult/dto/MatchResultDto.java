package com.admitconsult.dto;

import java.math.BigDecimal;

public record MatchResultDto(
        String universityId,
        String universityName,
        String universityCode,
        String region,
        String type,
        String majorId,
        String majorName,
        String majorCode,
        String subjectGroup,
        int year,
        BigDecimal cutoffScore,
        BigDecimal userScore,
        String likelihood
) {}
