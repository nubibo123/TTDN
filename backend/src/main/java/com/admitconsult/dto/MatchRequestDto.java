package com.admitconsult.dto;

import java.math.BigDecimal;

public record MatchRequestDto(
        BigDecimal math,
        BigDecimal physics,
        BigDecimal chemistry,
        BigDecimal literature,
        BigDecimal english,
        BigDecimal biology,
        String method,
        Integer year,
        BigDecimal tolerance
) {}
