package com.admitconsult.controller;

import com.admitconsult.dto.ApiResponse;
import com.admitconsult.dto.UniversityDto;
import com.admitconsult.entity.University;
import com.admitconsult.repository.UniversityRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/universities")
@RequiredArgsConstructor
public class UniversityController {

    private final UniversityRepository universityRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<List<UniversityDto>>> getAll() {
        List<UniversityDto> list = universityRepository.findAll().stream()
                .map(this::toDto)
                .toList();
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<UniversityDto>> getById(@PathVariable String id) {
        return universityRepository.findById(id)
                .map(u -> ResponseEntity.ok(ApiResponse.success(toDto(u))))
                .orElseGet(() -> ResponseEntity.status(404).body(ApiResponse.error("Không tìm thấy trường")));
    }

    @GetMapping("/code/{code}")
    public ResponseEntity<ApiResponse<UniversityDto>> getByCode(@PathVariable String code) {
        return universityRepository.findByCode(code)
                .map(u -> ResponseEntity.ok(ApiResponse.success(toDto(u))))
                .orElseGet(() -> ResponseEntity.status(404).body(ApiResponse.error("Không tìm thấy trường")));
    }

    private UniversityDto toDto(University u) {
        return new UniversityDto(
                u.getId(), u.getCode(), u.getName(),
                u.getRegion().name(), u.getType().name(),
                u.getAddress(), u.getWebsiteUrl(),
                u.getTuitionRange(), u.getIsVerified(),
                u.getDeanUrl(), u.getLatitude(), u.getLongitude()
        );
    }
}