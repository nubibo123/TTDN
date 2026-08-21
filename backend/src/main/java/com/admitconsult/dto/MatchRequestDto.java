package com.admitconsult.dto;

import java.math.BigDecimal;

public record MatchRequestDto(
  BigDecimal math,
  BigDecimal physics,
  BigDecimal chemistry,
  BigDecimal literature,
  BigDecimal english,
  BigDecimal biology,
  BigDecimal history,
  BigDecimal geography,
  BigDecimal gdcd,
  String method,
  Integer year,
  BigDecimal tolerance,
  String subjectGroup
) {}
