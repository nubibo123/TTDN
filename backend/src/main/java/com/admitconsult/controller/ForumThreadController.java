package com.admitconsult.controller;

import com.admitconsult.dto.ApiResponse;
import com.admitconsult.dto.ForumThreadDto;
import com.admitconsult.entity.ForumThread;
import com.admitconsult.repository.ForumThreadRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/forum-threads")
@RequiredArgsConstructor
public class ForumThreadController {

    private final ForumThreadRepository forumThreadRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<List<ForumThreadDto>>> getAll(
            @RequestParam(required = false) String categoryId,
            @RequestParam(required = false) String authorId) {

        List<ForumThread> list;
        if (categoryId != null) {
            list = forumThreadRepository.findByCategoryIdOrderByCreatedAtDesc(categoryId);
        } else if (authorId != null) {
            list = forumThreadRepository.findByAuthorIdOrderByCreatedAtDesc(authorId);
        } else {
            list = forumThreadRepository.findAll();
        }

        List<ForumThreadDto> dtos = list.stream().map(this::toDto).toList();
        return ResponseEntity.ok(ApiResponse.success(dtos));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ForumThreadDto>> getById(@PathVariable String id) {
        return forumThreadRepository.findById(id)
                .map(t -> {
                    t.setViewsCount(t.getViewsCount() + 1);
                    forumThreadRepository.save(t);
                    return ResponseEntity.ok(ApiResponse.success(toDto(t)));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    private ForumThreadDto toDto(ForumThread t) {
        return new ForumThreadDto(
                t.getId(), t.getAuthorId(),
                t.getAuthor() != null ? t.getAuthor().getName() : null,
                t.getCategoryId(),
                t.getCategory() != null ? t.getCategory().getName() : null,
                t.getTitle(), t.getContent(),
                t.getViewsCount(), t.getIsPinned(), t.getIsLocked(),
                t.getCreatedAt(),
                t.getPosts() != null ? t.getPosts().size() : 0
        );
    }
}