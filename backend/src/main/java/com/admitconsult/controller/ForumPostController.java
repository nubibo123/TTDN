package com.admitconsult.controller;

import com.admitconsult.dto.ApiResponse;
import com.admitconsult.dto.ForumPostDto;
import com.admitconsult.entity.ForumPost;
import com.admitconsult.repository.ForumPostRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/forum-posts")
@RequiredArgsConstructor
public class ForumPostController {

    private final ForumPostRepository forumPostRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<List<ForumPostDto>>> getAll(
            @RequestParam(required = false) String threadId,
            @RequestParam(required = false) String parentId) {

        List<ForumPost> list;
        if (threadId != null) {
            list = forumPostRepository.findByThreadIdOrderByCreatedAtAsc(threadId);
        } else if (parentId != null) {
            list = forumPostRepository.findByParentIdOrderByCreatedAtAsc(parentId);
        } else {
            list = forumPostRepository.findAll();
        }

        List<ForumPostDto> dtos = list.stream().map(this::toDto).toList();
        return ResponseEntity.ok(ApiResponse.success(dtos));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ForumPostDto>> getById(@PathVariable String id) {
        return forumPostRepository.findById(id)
                .map(p -> ResponseEntity.ok(ApiResponse.success(toDto(p))))
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/like")
    public ResponseEntity<ApiResponse<Void>> toggleLike(@PathVariable String id) {
        forumPostRepository.findById(id).ifPresent(post -> {
            post.setLikesCount(post.getLikesCount() + 1);
            forumPostRepository.save(post);
        });
        return ResponseEntity.ok(ApiResponse.success("Liked", null));
    }

    private ForumPostDto toDto(ForumPost p) {
        return new ForumPostDto(
                p.getId(), p.getThreadId(),
                p.getAuthorId(),
                p.getAuthor() != null ? p.getAuthor().getName() : null,
                p.getParentId(), p.getContent(),
                p.getLikesCount(), p.getIsOfficialReply(),
                p.getCreatedAt()
        );
    }
}