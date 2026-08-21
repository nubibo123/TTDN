package com.admitconsult.service;

import com.admitconsult.dto.MatchRequestDto;
import com.admitconsult.dto.MatchResultDto;
import com.admitconsult.entity.AdmissionScore;
import com.admitconsult.entity.Major;
import com.admitconsult.repository.AdmissionScoreRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.text.Normalizer;
import java.util.*;
import java.util.regex.Pattern;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
public class MatchService {

  private final AdmissionScoreRepository admissionScoreRepository;

  private static final Pattern DIACRITICS = Pattern.compile("\\p{InCombiningDiacriticalMarks}+");

  /**
   * Strip Vietnamese diacritics so "Điểm thi THPT" matches "Diem thi THPT".
   */
  private static String unaccent(String s) {
    if (s == null)
      return null;
    String normalized = Normalizer.normalize(s, Normalizer.Form.NFD);
    return DIACRITICS.matcher(normalized).replaceAll("").replace('đ', 'd').replace('Đ', 'D');
  }

  /**
   * Server-side match:
   * 1. Score the user's input against the chosen method.
   * 2. Filter scores to majors whose subjectGroup matches that method AND year is
   * requested.
   * 3. Return one result per (major, year, method) with likelihood.
   */
  @Transactional(readOnly = true)
  public List<MatchResultDto> match(MatchRequestDto req) {
    BigDecimal tolerance = req.tolerance() != null ? req.tolerance() : new BigDecimal("3");
    int year = req.year() != null ? req.year() : currentYear();

    String requestedMethod = req.method();
    String methodUnaccented = unaccent(requestedMethod != null ? requestedMethod : "Diem thi THPT");

    BigDecimal userTotal = computeTotal(req, methodUnaccented);
    BigDecimal minCutoff = userTotal.subtract(tolerance);
    BigDecimal maxCutoff = userTotal.add(tolerance);

    String requestedSubjectGroup = req.subjectGroup();
    boolean hasSubjectGroup = requestedSubjectGroup != null && !requestedSubjectGroup.isBlank();

    List<AdmissionScore> scores = admissionScoreRepository.findAll();
    Map<String, AdmissionScore> picked = new LinkedHashMap<>();
    for (AdmissionScore s : scores) {
      if (s.getYear() == null || s.getYear() != year)
        continue;
      if (s.getScore() == null)
        continue;

      String scoreMethod = unaccent(s.getMethod());
      if (!methodMatchesMethod(scoreMethod, methodUnaccented))
        continue;

      if (s.getScore().compareTo(minCutoff) < 0 || s.getScore().compareTo(maxCutoff) > 0)
        continue;

      Major m = s.getMajor();
      if (m == null || m.getUniversity() == null)
        continue;

      String majorGroup = m.getSubjectGroup();
      if (hasSubjectGroup) {
        if (majorGroup == null || majorGroup.isBlank())
          continue;
        String upperReq = requestedSubjectGroup.trim().toUpperCase();
        boolean match = Stream.of(majorGroup.toUpperCase().split("[;,\\s\\-–/]+"))
            .map(String::trim)
            .anyMatch(part -> part.equals(upperReq)) || majorGroup.toUpperCase().contains(upperReq);
        if (!match)
          continue;
      } else {
        if (!methodMatchesSubjectGroup(methodUnaccented, majorGroup))
          continue;
      }

      String key = m.getId() + "|" + year + "|" + scoreMethod;
      AdmissionScore existing = picked.get(key);
      if (existing == null || s.getScore().subtract(existing.getScore()).abs().compareTo(BigDecimal.ZERO) < 0) {
        picked.put(key, s);
      }
    }

    List<MatchResultDto> out = new ArrayList<>(picked.size());
    for (AdmissionScore s : picked.values()) {
      Major m = s.getMajor();
      out.add(new MatchResultDto(
          m.getUniversity().getId(),
          m.getUniversity().getName(),
          m.getUniversity().getCode(),
          m.getUniversity().getRegion().name(),
          m.getUniversity().getType().name(),
          m.getId(),
          m.getName(),
          m.getCode(),
          m.getSubjectGroup(),
          s.getYear(),
          s.getScore(),
          userTotal,
          likelihood(userTotal, s.getScore())));
    }
    out.sort(Comparator.comparing(MatchResultDto::cutoffScore));
    return out;
  }

  /**
   * Loose match: THPT-style scores accept either "Thi THPT" or any non-hocsinha
   * method.
   * Hocsinha accepts anything that contains "hoc sinh" (unaccented).
   */
  private boolean methodMatchesMethod(String scoreMethodUnaccented, String requestedMethodUnaccented) {
    if (scoreMethodUnaccented == null)
      return false;
    if (requestedMethodUnaccented == null || requestedMethodUnaccented.isBlank())
      return true;
    if (scoreMethodUnaccented.equalsIgnoreCase(requestedMethodUnaccented))
      return true;

    boolean reqIsThpt = requestedMethodUnaccented.toLowerCase().contains("thpt");
    boolean scoreIsThpt = scoreMethodUnaccented.toLowerCase().contains("thpt");
    boolean reqIsHs = requestedMethodUnaccented.toLowerCase().contains("hoc sinh");
    boolean scoreIsHs = scoreMethodUnaccented.toLowerCase().contains("hoc sinh");

    if (reqIsThpt && scoreIsThpt)
      return true;
    if (reqIsHs && scoreIsHs)
      return true;
    return false;
  }

  private boolean methodMatchesSubjectGroup(String methodUnaccented, String subjectGroup) {
    if (subjectGroup == null || subjectGroup.isBlank())
      return true;
    String sg = subjectGroup.toUpperCase(Locale.ROOT);
    boolean isThpt = methodUnaccented != null && methodUnaccented.toLowerCase().contains("thpt");
    if (!isThpt) {
      return true;
    }
    return sg.contains("00")
        || sg.contains("01")
        || sg.contains("07")
        || sg.startsWith("A0")
        || sg.startsWith("B0")
        || sg.startsWith("C0")
        || sg.startsWith("D0")
        || sg.startsWith("V");
  }

  private BigDecimal computeTotal(MatchRequestDto req, String methodUnaccented) {
    BigDecimal sum = BigDecimal.ZERO;
    String group = req.subjectGroup() != null && !req.subjectGroup().isBlank()
        ? req.subjectGroup().trim().toUpperCase()
        : computeKhoi(methodUnaccented);

    switch (group) {
      case "A00" -> {
        if (isValidScore(req.math())) sum = sum.add(req.math());
        if (isValidScore(req.physics())) sum = sum.add(req.physics());
        if (isValidScore(req.chemistry())) sum = sum.add(req.chemistry());
      }
      case "A01", "E06" -> {
        if (isValidScore(req.math())) sum = sum.add(req.math());
        if (isValidScore(req.physics())) sum = sum.add(req.physics());
        if (isValidScore(req.english())) sum = sum.add(req.english());
      }
      case "A02" -> {
        if (isValidScore(req.math())) sum = sum.add(req.math());
        if (isValidScore(req.physics())) sum = sum.add(req.physics());
        if (isValidScore(req.biology())) sum = sum.add(req.biology());
      }
      case "A04" -> {
        if (isValidScore(req.math())) sum = sum.add(req.math());
        if (isValidScore(req.physics())) sum = sum.add(req.physics());
        if (isValidScore(req.geography())) sum = sum.add(req.geography());
      }
      case "A07" -> {
        if (isValidScore(req.math())) sum = sum.add(req.math());
        if (isValidScore(req.history())) sum = sum.add(req.history());
        if (isValidScore(req.geography())) sum = sum.add(req.geography());
      }
      case "B00" -> {
        if (isValidScore(req.math())) sum = sum.add(req.math());
        if (isValidScore(req.chemistry())) sum = sum.add(req.chemistry());
        if (isValidScore(req.biology())) sum = sum.add(req.biology());
      }
      case "B08", "D08" -> {
        if (isValidScore(req.math())) sum = sum.add(req.math());
        if (isValidScore(req.biology())) sum = sum.add(req.biology());
        if (isValidScore(req.english())) sum = sum.add(req.english());
      }
      case "C00" -> {
        if (isValidScore(req.literature())) sum = sum.add(req.literature());
        if (isValidScore(req.history())) sum = sum.add(req.history());
        if (isValidScore(req.geography())) sum = sum.add(req.geography());
      }
      case "C01" -> {
        if (isValidScore(req.literature())) sum = sum.add(req.literature());
        if (isValidScore(req.math())) sum = sum.add(req.math());
        if (isValidScore(req.physics())) sum = sum.add(req.physics());
      }
      case "C02" -> {
        if (isValidScore(req.literature())) sum = sum.add(req.literature());
        if (isValidScore(req.math())) sum = sum.add(req.math());
        if (isValidScore(req.chemistry())) sum = sum.add(req.chemistry());
      }
      case "C03" -> {
        if (isValidScore(req.literature())) sum = sum.add(req.literature());
        if (isValidScore(req.math())) sum = sum.add(req.math());
        if (isValidScore(req.history())) sum = sum.add(req.history());
      }
      case "C04" -> {
        if (isValidScore(req.literature())) sum = sum.add(req.literature());
        if (isValidScore(req.math())) sum = sum.add(req.math());
        if (isValidScore(req.geography())) sum = sum.add(req.geography());
      }
      case "C08" -> {
        if (isValidScore(req.literature())) sum = sum.add(req.literature());
        if (isValidScore(req.chemistry())) sum = sum.add(req.chemistry());
        if (isValidScore(req.biology())) sum = sum.add(req.biology());
      }
      case "C14", "X01" -> {
        if (isValidScore(req.literature())) sum = sum.add(req.literature());
        if (isValidScore(req.math())) sum = sum.add(req.math());
        if (isValidScore(req.gdcd())) sum = sum.add(req.gdcd());
      }
      case "D01", "D84", "E03" -> {
        if (isValidScore(req.math())) sum = sum.add(req.math());
        if (isValidScore(req.literature())) sum = sum.add(req.literature());
        if (isValidScore(req.english())) sum = sum.add(req.english());
      }
      case "D07" -> {
        if (isValidScore(req.math())) sum = sum.add(req.math());
        if (isValidScore(req.chemistry())) sum = sum.add(req.chemistry());
        if (isValidScore(req.english())) sum = sum.add(req.english());
      }
      case "D09" -> {
        if (isValidScore(req.math())) sum = sum.add(req.math());
        if (isValidScore(req.history())) sum = sum.add(req.history());
        if (isValidScore(req.english())) sum = sum.add(req.english());
      }
      case "D10" -> {
        if (isValidScore(req.math())) sum = sum.add(req.math());
        if (isValidScore(req.geography())) sum = sum.add(req.geography());
        if (isValidScore(req.english())) sum = sum.add(req.english());
      }
      case "D14", "E01" -> {
        if (isValidScore(req.literature())) sum = sum.add(req.literature());
        if (isValidScore(req.history())) sum = sum.add(req.history());
        if (isValidScore(req.english())) sum = sum.add(req.english());
      }
      case "D15", "E02" -> {
        if (isValidScore(req.literature())) sum = sum.add(req.literature());
        if (isValidScore(req.geography())) sum = sum.add(req.geography());
        if (isValidScore(req.english())) sum = sum.add(req.english());
      }
      case "X05" -> {
        if (isValidScore(req.math())) sum = sum.add(req.math());
        if (isValidScore(req.physics())) sum = sum.add(req.physics());
        if (isValidScore(req.gdcd())) sum = sum.add(req.gdcd());
      }
      case "X09" -> {
        if (isValidScore(req.math())) sum = sum.add(req.math());
        if (isValidScore(req.chemistry())) sum = sum.add(req.chemistry());
        if (isValidScore(req.gdcd())) sum = sum.add(req.gdcd());
      }
      case "X13" -> {
        if (isValidScore(req.math())) sum = sum.add(req.math());
        if (isValidScore(req.biology())) sum = sum.add(req.biology());
        if (isValidScore(req.gdcd())) sum = sum.add(req.gdcd());
      }
      case "X17" -> {
        if (isValidScore(req.math())) sum = sum.add(req.math());
        if (isValidScore(req.history())) sum = sum.add(req.history());
        if (isValidScore(req.gdcd())) sum = sum.add(req.gdcd());
      }
      case "X21" -> {
        if (isValidScore(req.math())) sum = sum.add(req.math());
        if (isValidScore(req.geography())) sum = sum.add(req.geography());
        if (isValidScore(req.gdcd())) sum = sum.add(req.gdcd());
      }
      case "X25" -> {
        if (isValidScore(req.math())) sum = sum.add(req.math());
        if (isValidScore(req.english())) sum = sum.add(req.english());
        if (isValidScore(req.gdcd())) sum = sum.add(req.gdcd());
      }
      case "X70" -> {
        if (isValidScore(req.literature())) sum = sum.add(req.literature());
        if (isValidScore(req.history())) sum = sum.add(req.history());
        if (isValidScore(req.gdcd())) sum = sum.add(req.gdcd());
      }
      case "X74" -> {
        if (isValidScore(req.literature())) sum = sum.add(req.literature());
        if (isValidScore(req.geography())) sum = sum.add(req.geography());
        if (isValidScore(req.gdcd())) sum = sum.add(req.gdcd());
      }
      case "X78", "D66", "C20" -> {
        if (isValidScore(req.literature())) sum = sum.add(req.literature());
        if (isValidScore(req.gdcd())) sum = sum.add(req.gdcd());
        if (isValidScore(req.english())) sum = sum.add(req.english());
      }
      default -> {
        if (isValidScore(req.math())) sum = sum.add(req.math());
        if (isValidScore(req.physics())) sum = sum.add(req.physics());
        if (isValidScore(req.chemistry())) sum = sum.add(req.chemistry());
        if (isValidScore(req.literature())) sum = sum.add(req.literature());
        if (isValidScore(req.english())) sum = sum.add(req.english());
        if (isValidScore(req.biology())) sum = sum.add(req.biology());
        if (isValidScore(req.history())) sum = sum.add(req.history());
        if (isValidScore(req.geography())) sum = sum.add(req.geography());
        if (isValidScore(req.gdcd())) sum = sum.add(req.gdcd());
      }
    }
    return sum.setScale(2, RoundingMode.HALF_UP);
  }

  private static boolean isValidScore(BigDecimal score) {
    if (score == null)
      return false;
    double val = score.doubleValue();
    return val >= 0.0 && val <= 10.0;
  }

  private String computeKhoi(String methodUnaccented) {
    if (methodUnaccented == null)
      return "A00";
    String m = methodUnaccented.toUpperCase(Locale.ROOT);
    if (m.contains("A00"))
      return "A00";
    if (m.contains("A01"))
      return "A01";
    if (m.contains("D01"))
      return "D01";
    return "A00";
  }

  private String likelihood(BigDecimal user, BigDecimal cutoff) {
    if (cutoff == null)
      return "unknown";
    BigDecimal delta = user.subtract(cutoff);
    if (delta.compareTo(new BigDecimal("2")) >= 0)
      return "high";
    if (delta.compareTo(BigDecimal.ZERO) >= 0)
      return "medium";
    if (delta.compareTo(new BigDecimal("-2")) >= 0)
      return "low";
    return "very_low";
  }

  private static int currentYear() {
    return Calendar.getInstance().get(Calendar.YEAR);
  }
}
