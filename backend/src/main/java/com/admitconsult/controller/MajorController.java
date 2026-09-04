package com.admitconsult.controller;

import com.admitconsult.dto.ApiResponse;
import com.admitconsult.dto.MajorDto;
import com.admitconsult.entity.Major;
import com.admitconsult.repository.MajorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/majors")
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MajorController {

    private final MajorRepository majorRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<List<MajorDto>>> getAll(
            @RequestParam(required = false) String universityId,
            @RequestParam(required = false) String subjectGroup) {

        List<Major> list;
        if (universityId != null) {
            list = majorRepository.findByUniversityId(universityId);
        } else if (subjectGroup != null) {
            list = majorRepository.findBySubjectGroup(subjectGroup);
        } else {
            list = majorRepository.findAll();
        }

        List<MajorDto> dtos = list.stream().map(this::toDto).toList();
        return ResponseEntity.ok(ApiResponse.success(dtos));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<MajorDto>> getById(@PathVariable String id) {
        return majorRepository.findById(id)
                .map(m -> ResponseEntity.ok(ApiResponse.success(toDto(m))))
                .orElse(ResponseEntity.notFound().build());
    }

    private MajorDto toDto(Major m) {
        return new MajorDto(
                m.getId(), m.getUniversity().getId(), m.getUniversity().getName(),
                m.getCode(), m.getName(), m.getSubjectGroup(),
                m.getDescription(), m.getTuitionMin(), m.getTuitionMax(),
                m.getCareerPaths(), m.getIsActive(),
                m.getCategory() != null ? m.getCategory().getId() : null,
                m.getCategory() != null ? m.getCategory().getName() : null
        );
    }
}