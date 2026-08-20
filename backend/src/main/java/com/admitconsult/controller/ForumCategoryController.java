package com.admitconsult.controller;

import com.admitconsult.dto.ApiResponse;
import com.admitconsult.entity.ForumCategory;
import com.admitconsult.repository.ForumCategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/forum-categories")
@RequiredArgsConstructor
public class ForumCategoryController {

    private final ForumCategoryRepository forumCategoryRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<List<ForumCategoryDto>>> getAll() {
        List<ForumCategoryDto> list = forumCategoryRepository.findAll().stream()
                .sorted(java.util.Comparator.comparing(ForumCategory::getDisplayOrder))
                .map(this::toDto)
                .toList();
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ForumCategoryDto>> getById(@PathVariable String id) {
        return forumCategoryRepository.findById(id)
                .map(c -> ResponseEntity.ok(ApiResponse.success(toDto(c))))
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/slug/{slug}")
    public ResponseEntity<ApiResponse<ForumCategoryDto>> getBySlug(@PathVariable String slug) {
        return forumCategoryRepository.findBySlug(slug)
                .map(c -> ResponseEntity.ok(ApiResponse.success(toDto(c))))
                .orElse(ResponseEntity.notFound().build());
    }

    private ForumCategoryDto toDto(ForumCategory c) {
        return new ForumCategoryDto(c.getId(), c.getName(), c.getSlug(), c.getDisplayOrder());
    }

    @lombok.Data
    @lombok.AllArgsConstructor
    public static class ForumCategoryDto {
        private String id;
        private String name;
        private String slug;
        private Integer displayOrder;
    }
}
