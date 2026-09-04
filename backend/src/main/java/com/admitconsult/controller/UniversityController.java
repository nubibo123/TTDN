package com.admitconsult.controller;

import com.admitconsult.dto.ApiResponse;
import com.admitconsult.dto.UniversityDto;
import com.admitconsult.entity.University;
import com.admitconsult.repository.UniversityRepository;
import com.admitconsult.service.UniversityService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/universities")
@RequiredArgsConstructor
public class UniversityController {

    private final UniversityRepository universityRepository;
    private final UniversityService universityService;

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
                .or(() -> universityRepository.findByCode(id))
                .map(u -> ResponseEntity.ok(ApiResponse.success(toDto(u))))
                .orElseGet(() -> ResponseEntity.status(404).body(ApiResponse.error("Không tìm thấy trường")));
    }

    @GetMapping("/code/{code}")
    public ResponseEntity<ApiResponse<UniversityDto>> getByCode(@PathVariable String code) {
        return universityRepository.findByCode(code)
                .map(u -> ResponseEntity.ok(ApiResponse.success(toDto(u))))
                .orElseGet(() -> ResponseEntity.status(404).body(ApiResponse.error("Không tìm thấy trường")));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<UniversityDto>> create(@RequestBody UniversityDto dto) {
        try {
            University university = toEntity(dto);
            University saved = universityService.createUniversity(university);
            return ResponseEntity.status(201).body(ApiResponse.success(toDto(saved)));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<UniversityDto>> update(@PathVariable String id, @RequestBody UniversityDto dto) {
        try {
            University university = toEntity(dto);
            University updated = universityService.updateUniversity(id, university);
            return ResponseEntity.ok(ApiResponse.success(toDto(updated)));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<String>> delete(@PathVariable String id) {
        try {
            universityService.deleteUniversity(id);
            return ResponseEntity.ok(ApiResponse.success("Delete success!"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
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

    private University toEntity(UniversityDto dto) {
        University university = new University();
        university.setCode(dto.getCode());
        university.setName(dto.getName());
        university.setRegion(University.UniversityRegion.valueOf(dto.getRegion()));
        university.setType(University.UniversityType.valueOf(dto.getType()));
        university.setAddress(dto.getAddress());
        university.setWebsiteUrl(dto.getWebsiteUrl());
        university.setTuitionRange(dto.getTuitionRange());
        university.setIsVerified(dto.getIsVerified() != null ? dto.getIsVerified() : false);
        university.setDeanUrl(dto.getDeanUrl());
        university.setLatitude(dto.getLatitude());
        university.setLongitude(dto.getLongitude());
        return university;
    }
}