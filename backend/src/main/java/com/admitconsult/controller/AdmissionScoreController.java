package com.admitconsult.controller;

import com.admitconsult.dto.ApiResponse;
import com.admitconsult.dto.AdmissionScoreDto;
import com.admitconsult.entity.AdmissionScore;
import com.admitconsult.repository.AdmissionScoreRepository;
import com.admitconsult.repository.MajorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admission-scores")
@RequiredArgsConstructor
public class AdmissionScoreController {

    private final AdmissionScoreRepository admissionScoreRepository;
    private final MajorRepository majorRepository;
    private final com.admitconsult.repository.UniversityRepository universityRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<List<AdmissionScoreDto>>> getAll(
            @RequestParam(required = false) String majorId,
            @RequestParam(required = false) String universityId,
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) String method) {

        List<AdmissionScore> list;
        if (majorId != null && year != null) {
            list = admissionScoreRepository.findByMajorIdAndYear(majorId, year);
        } else if (majorId != null) {
            list = admissionScoreRepository.findByMajorId(majorId);
        } else if (universityId != null && !universityId.isBlank()) {
            String resolvedUniId = universityRepository.findById(universityId)
                    .or(() -> universityRepository.findByCode(universityId))
                    .map(com.admitconsult.entity.University::getId)
                    .orElse(universityId);
            list = admissionScoreRepository.findByMajor_University_Id(resolvedUniId);
        } else {
            list = admissionScoreRepository.findAll();
        }

        List<AdmissionScoreDto> dtos = list.stream().map(this::toDto).toList();
        return ResponseEntity.ok(ApiResponse.success(dtos));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<AdmissionScoreDto>> getById(@PathVariable String id) {
        return admissionScoreRepository.findById(id)
                .map(s -> ResponseEntity.ok(ApiResponse.success(toDto(s))))
                .orElse(ResponseEntity.notFound().build());
    }

    private AdmissionScoreDto toDto(AdmissionScore s) {
        return new AdmissionScoreDto(
                s.getId(), s.getMajor().getId(), s.getMajor().getName(),
                s.getMajor().getUniversity().getId(), s.getMajor().getUniversity().getName(),
                s.getYear(), s.getMethod(), s.getScore(), s.getNote(), s.getUrl()
        );
    }
}