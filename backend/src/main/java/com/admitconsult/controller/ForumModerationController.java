package com.admitconsult.controller;

import com.admitconsult.dto.ApiResponse;
import com.admitconsult.repository.ForumThreadRepository;
import com.admitconsult.repository.ForumPostRepository;
import com.admitconsult.service.ForumModerationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class ForumModerationController {
    private final ForumThreadRepository threads;
    private final ForumPostRepository posts;
    private final ForumModerationService moderation;

    @PostMapping("/forum-threads/{id}/moderate")
    public ResponseEntity<ApiResponse<ForumModerationService.Result>> moderate(@PathVariable String id) {
        return threads.findById(id)
                .map(thread -> ResponseEntity.ok(ApiResponse.success(
                        moderation.moderate(thread.getTitle(), thread.getContent()))))
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping("/forum-posts/{id}/moderate")
    public ResponseEntity<ApiResponse<ForumModerationService.Result>> moderateComment(@PathVariable String id) {
        return posts.findById(id).filter(post -> !Boolean.TRUE.equals(post.getIsDeleted()))
                .map(post -> ResponseEntity.ok(ApiResponse.success(
                        moderation.moderate("Bình luận trong diễn đàn tư vấn tuyển sinh", post.getContent()))))
                .orElseGet(() -> ResponseEntity.notFound().build());
    }
}
