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
import java.util.*;

@Service
@RequiredArgsConstructor
public class MatchService {

    private final AdmissionScoreRepository admissionScoreRepository;

    /**
     * Server-side match:
     * 1. Score the user's input against the chosen method.
     * 2. Filter scores to majors whose subjectGroup matches that method AND year is requested.
     * 3. Return one result per (major, year, method) with likelihood.
     *
     * The user only sees majors with at least one score centered on their input — no need to ship
     * the entire majors / scores tables to the client.
     */
    @Transactional(readOnly = true)
    public List<MatchResultDto> match(MatchRequestDto req) {
        BigDecimal tolerance = req.tolerance() != null ? req.tolerance() : new BigDecimal("3");
        int year = req.year() != null ? req.year() : 2024;
        String method = req.method() != null ? req.method() : "Diem thi THPT";

        BigDecimal userTotal = computeTotal(req, method);
        BigDecimal minCutoff = userTotal.subtract(tolerance);
        BigDecimal maxCutoff = userTotal.add(tolerance);

        List<AdmissionScore> scores = admissionScoreRepository.findAll();
        Map<String, AdmissionScore> picked = new LinkedHashMap<>();
        for (AdmissionScore s : scores) {
            if (!method.equalsIgnoreCase(s.getMethod())) continue;
            if (s.getYear() == null || s.getYear() != year) continue;
            if (s.getScore() == null) continue;
            if (s.getScore().compareTo(minCutoff) < 0 || s.getScore().compareTo(maxCutoff) > 0) continue;

            Major m = s.getMajor();
            if (m == null || m.getUniversity() == null) continue;
            if (!methodMatchesSubjectGroup(method, m.getSubjectGroup())) continue;

            String key = m.getId() + "|" + year + "|" + method;
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
                    likelihood(userTotal, s.getScore())
            ));
        }
        out.sort(Comparator.comparing(MatchResultDto::cutoffScore));
        return out;
    }

    private boolean methodMatchesSubjectGroup(String method, String subjectGroup) {
        if (subjectGroup == null || subjectGroup.isBlank()) return true;
        if (method.equalsIgnoreCase("Diem thi THPT")) {
            return subjectGroup.contains("00")
                    || subjectGroup.contains("01")
                    || subjectGroup.contains("07")
                    || subjectGroup.toUpperCase().contains("A0")
                    || subjectGroup.toUpperCase().contains("B0")
                    || subjectGroup.toUpperCase().contains("C0")
                    || subjectGroup.toUpperCase().contains("D0");
        }
        return true;
    }

    private BigDecimal computeTotal(MatchRequestDto req, String method) {
        BigDecimal sum = BigDecimal.ZERO;
        if (req.math() != null) sum = sum.add(req.math());
        if ("A00".equals(computeKhoi(method))) {
            if (req.physics() != null) sum = sum.add(req.physics());
            if (req.chemistry() != null) sum = sum.add(req.chemistry());
        } else if (req.physics() != null) {
            sum = sum.add(req.physics());
        }
        if (req.english() != null) sum = sum.add(req.english());
        if (req.literature() != null) sum = sum.add(req.literature());
        if (req.biology() != null) sum = sum.add(req.biology());
        return sum.setScale(2, RoundingMode.HALF_UP);
    }

    private String computeKhoi(String method) {
        if (method == null) return "A00";
        String m = method.toUpperCase(Locale.ROOT);
        if (m.contains("A00")) return "A00";
        if (m.contains("A01")) return "A01";
        if (m.contains("D01")) return "D01";
        return "A00";
    }

    private String likelihood(BigDecimal user, BigDecimal cutoff) {
        if (cutoff == null) return "unknown";
        BigDecimal delta = user.subtract(cutoff);
        if (delta.compareTo(new BigDecimal("2")) >= 0) return "high";
        if (delta.compareTo(BigDecimal.ZERO) >= 0) return "medium";
        if (delta.compareTo(new BigDecimal("-2")) >= 0) return "low";
        return "very_low";
    }
}
