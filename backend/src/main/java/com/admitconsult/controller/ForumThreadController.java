package com.admitconsult.controller;

import com.admitconsult.dto.ApiResponse;
import com.admitconsult.dto.ForumThreadDto;
import com.admitconsult.dto.UserPrincipal;
import com.admitconsult.entity.ForumCategory;
import com.admitconsult.entity.ForumThread;
import com.admitconsult.entity.ThreadLike;
import com.admitconsult.entity.User;
import com.admitconsult.entity.UserRoleRecord;
import com.admitconsult.repository.ForumCategoryRepository;
import com.admitconsult.repository.ForumPostRepository;
import com.admitconsult.repository.ForumThreadRepository;
import com.admitconsult.repository.ThreadLikeRepository;
import com.admitconsult.repository.UserRepository;
import com.admitconsult.repository.UserRoleRecordRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

import org.springframework.transaction.annotation.Transactional;

@RestController
@RequestMapping("/api/forum-threads")
@RequiredArgsConstructor
@Transactional
public class ForumThreadController {

    private final ForumThreadRepository forumThreadRepository;
    private final ForumCategoryRepository forumCategoryRepository;
    private final ForumPostRepository forumPostRepository;
    private final ThreadLikeRepository threadLikeRepository;
    private final UserRepository userRepository;
    private final UserRoleRecordRepository userRoleRecordRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<List<ForumThreadDto>>> getAll(
            @AuthenticationPrincipal UserPrincipal principal,
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

        String currentUserId = principal != null ? principal.getId() : null;
        List<ForumThreadDto> dtos = list.stream()
                .map(t -> toDto(t, currentUserId))
                .toList();
        return ResponseEntity.ok(ApiResponse.success(dtos));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ForumThreadDto>> getById(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String id) {
        String currentUserId = principal != null ? principal.getId() : null;
        return forumThreadRepository.findById(id)
                .map(t -> ResponseEntity.ok(ApiResponse.success(toDto(t, currentUserId))))
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/view")
    public ResponseEntity<ApiResponse<ForumThreadDto>> registerView(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String id) {
        String currentUserId = principal != null ? principal.getId() : null;
        return forumThreadRepository.findById(id)
                .map(t -> {
                    t.setViewsCount(t.getViewsCount() + 1);
                    forumThreadRepository.save(t);
                    return ResponseEntity.ok(ApiResponse.success(toDto(t, currentUserId)));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/like")
    public ResponseEntity<ApiResponse<LikeResponse>> toggleLike(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String id) {
        if (principal == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("Authentication required"));
        }
        ForumThread thread = forumThreadRepository.findById(id).orElse(null);
        if (thread == null) {
            return ResponseEntity.notFound().build();
        }

        boolean liked;
        var existing = threadLikeRepository.findByThreadIdAndUserId(id, principal.getId());
        if (existing.isPresent()) {
            threadLikeRepository.deleteByThreadIdAndUserId(id, principal.getId());
            thread.setLikesCount(Math.max(0, thread.getLikesCount() - 1));
            liked = false;
        } else {
            threadLikeRepository.save(ThreadLike.builder()
                    .threadId(id)
                    .userId(principal.getId())
                    .build());
            thread.setLikesCount(thread.getLikesCount() + 1);
            liked = true;
        }
        ForumThread saved = forumThreadRepository.save(thread);
        return ResponseEntity.ok(ApiResponse.success(new LikeResponse(id, liked, saved.getLikesCount())));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ForumThreadDto>> create(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody CreateThreadRequest request) {
        if (principal == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("Authentication required"));
        }
        if (request.getTitle() == null || request.getTitle().isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Tiêu đề không được để trống"));
        }
        if (request.getContent() == null || request.getContent().isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Nội dung không được để trống"));
        }
        ForumCategory category = forumCategoryRepository.findById(request.getCategoryId())
                .orElse(null);
        if (category == null) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Chủ đề không hợp lệ"));
        }

        boolean isPinned = Boolean.TRUE.equals(request.getIsPinned());

        ForumThread thread = ForumThread.builder()
                .authorId(principal.getId())
                .categoryId(request.getCategoryId())
                .title(request.getTitle().trim())
                .content(request.getContent().trim())
                .viewsCount(0)
                .isPinned(isPinned)
                .isLocked(false)
                .build();
        ForumThread saved = forumThreadRepository.save(thread);
        return ResponseEntity.ok(ApiResponse.success(toDto(saved, principal.getId())));
    }

    private boolean isVerifiedAdvisor(String userId) {
        return userRoleRecordRepository.findByUserId(userId).stream()
                .filter(r -> r.getRole() == UserRoleRecord.UserRole.ADVISOR)
                .anyMatch(r -> Boolean.TRUE.equals(r.getIsVerified()));
    }

    private ForumThreadDto toDto(ForumThread t, String currentUserId) {
        String authorName = t.getAuthor() != null ? t.getAuthor().getName() : null;
        if (authorName == null && t.getAuthorId() != null) {
            User author = userRepository.findById(t.getAuthorId()).orElse(null);
            authorName = author != null ? author.getName() : null;
        }
        String categoryName = t.getCategory() != null ? t.getCategory().getName() : null;
        if (categoryName == null && t.getCategoryId() != null) {
            ForumCategory category = forumCategoryRepository.findById(t.getCategoryId()).orElse(null);
            categoryName = category != null ? category.getName() : null;
        }
        long replyCount = t.getAuthorId() != null
                ? forumPostRepository.countByThreadIdAndParentIdIsNull(t.getId())
                : 0;
        boolean likedByMe = currentUserId != null
                && threadLikeRepository.findByThreadIdAndUserId(t.getId(), currentUserId).isPresent();
        return new ForumThreadDto(
                t.getId(), t.getAuthorId(),
                authorName,
                t.getCategoryId(),
                categoryName,
                t.getTitle(), t.getContent(),
                t.getViewsCount(), t.getLikesCount(), t.getIsPinned(), t.getIsLocked(),
                t.getCreatedAt(),
                (int) replyCount,
                isVerifiedAdvisor(t.getAuthorId()),
                likedByMe
        );
    }

    @lombok.Data
    public static class CreateThreadRequest {
        private String categoryId;
        private String title;
        private String content;
        private Boolean isPinned;
    }

    @lombok.Data
    @lombok.AllArgsConstructor
    public static class LikeResponse {
        private String threadId;
        private boolean liked;
        private int likesCount;
    }
}
