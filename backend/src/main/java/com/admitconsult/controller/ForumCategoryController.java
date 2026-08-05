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
    public ResponseEntity<ApiResponse<List<ForumCategory>>> getAll() {
        List<ForumCategory> list = forumCategoryRepository.findAll();
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ForumCategory>> getById(@PathVariable String id) {
        return forumCategoryRepository.findById(id)
                .map(c -> ResponseEntity.ok(ApiResponse.success(c)))
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/slug/{slug}")
    public ResponseEntity<ApiResponse<ForumCategory>> getBySlug(@PathVariable String slug) {
        return forumCategoryRepository.findBySlug(slug)
                .map(c -> ResponseEntity.ok(ApiResponse.success(c)))
                .orElse(ResponseEntity.notFound().build());
    }
}