package com.admitconsult.controller;

import com.admitconsult.dto.ApiResponse;
import com.admitconsult.dto.ForumPostDto;
import com.admitconsult.dto.UserPrincipal;
import com.admitconsult.entity.ForumPost;
import com.admitconsult.entity.ForumThread;
import com.admitconsult.entity.PostLike;
import com.admitconsult.entity.UserRoleRecord;
import com.admitconsult.repository.ForumPostRepository;
import com.admitconsult.repository.ForumThreadRepository;
import com.admitconsult.repository.PostLikeRepository;
import com.admitconsult.repository.UserRepository;
import com.admitconsult.repository.UserRoleRecordRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

import org.springframework.transaction.annotation.Transactional;

@RestController
@RequestMapping("/api/forum-posts")
@RequiredArgsConstructor
@Transactional
public class ForumPostController {

    private final ForumPostRepository forumPostRepository;
    private final ForumThreadRepository forumThreadRepository;
    private final PostLikeRepository postLikeRepository;
    private final UserRepository userRepository;
    private final UserRoleRecordRepository userRoleRecordRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<List<ForumPostDto>>> getAll(
            @AuthenticationPrincipal UserPrincipal principal,
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

        List<ForumPostDto> dtos = list.stream()
                .filter(p -> !Boolean.TRUE.equals(p.getIsDeleted()))
                .map(p -> toDto(p, principal != null ? principal.getId() : null))
                .toList();
        return ResponseEntity.ok(ApiResponse.success(dtos));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ForumPostDto>> getById(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String id) {
        return forumPostRepository.findById(id)
                .filter(p -> !Boolean.TRUE.equals(p.getIsDeleted()))
                .map(p -> ResponseEntity.ok(ApiResponse.success(toDto(p, principal != null ? principal.getId() : null))))
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ForumPostDto>> create(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody CreatePostRequest request) {
        if (principal == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("Authentication required"));
        }
        if (request.getContent() == null || request.getContent().isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Nội dung không được để trống"));
        }
        ForumThread thread = forumThreadRepository.findById(request.getThreadId())
                .orElse(null);
        if (thread == null) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Bài viết không tồn tại"));
        }
        if (Boolean.TRUE.equals(thread.getIsLocked())) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Bài viết đã bị khóa bình luận"));
        }

        String parentId = request.getParentId();
        if (parentId != null && !parentId.isBlank()) {
            ForumPost parent = forumPostRepository.findById(parentId).orElse(null);
            if (parent == null || !parent.getThreadId().equals(request.getThreadId())) {
                return ResponseEntity.badRequest().body(ApiResponse.error("Phản hồi không hợp lệ"));
            }
        } else {
            parentId = null;
        }

        ForumPost post = ForumPost.builder()
                .threadId(request.getThreadId())
                .authorId(principal.getId())
                .parentId(parentId)
                .content(request.getContent().trim())
                .likesCount(0)
                .isOfficialReply(false)
                .isDeleted(false)
                .build();
        ForumPost saved = forumPostRepository.save(post);
        return ResponseEntity.ok(ApiResponse.success(toDto(saved, principal.getId())));
    }

    @PostMapping("/{id}/like")
    public ResponseEntity<ApiResponse<LikeResponse>> toggleLike(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String id) {
        if (principal == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("Authentication required"));
        }
        ForumPost post = forumPostRepository.findById(id).orElse(null);
        if (post == null || Boolean.TRUE.equals(post.getIsDeleted())) {
            return ResponseEntity.notFound().build();
        }

        boolean liked;
        var existing = postLikeRepository.findByPostIdAndUserId(id, principal.getId());
        if (existing.isPresent()) {
            postLikeRepository.deleteByPostIdAndUserId(id, principal.getId());
            post.setLikesCount(Math.max(0, post.getLikesCount() - 1));
            liked = false;
        } else {
            postLikeRepository.save(PostLike.builder()
                    .postId(id)
                    .userId(principal.getId())
                    .build());
            post.setLikesCount(post.getLikesCount() + 1);
            liked = true;
        }
        ForumPost saved = forumPostRepository.save(post);
        return ResponseEntity.ok(ApiResponse.success(new LikeResponse(id, liked, saved.getLikesCount())));
    }

    private boolean isVerifiedAdvisor(String userId) {
        return userRoleRecordRepository.findByUserId(userId).stream()
                .filter(r -> r.getRole() == UserRoleRecord.UserRole.ADVISOR)
                .anyMatch(r -> Boolean.TRUE.equals(r.getIsVerified()));
    }

    private ForumPostDto toDto(ForumPost p, String currentUserId) {
        String authorName = p.getAuthor() != null ? p.getAuthor().getName() : null;
        if (authorName == null && p.getAuthorId() != null) {
            var author = userRepository.findById(p.getAuthorId()).orElse(null);
            authorName = author != null ? author.getName() : null;
        }
        boolean likedByMe = currentUserId != null
                && postLikeRepository.findByPostIdAndUserId(p.getId(), currentUserId).isPresent();
        return new ForumPostDto(
                p.getId(), p.getThreadId(),
                p.getAuthorId(),
                authorName,
                p.getParentId(), p.getContent(),
                p.getLikesCount(), p.getIsOfficialReply(),
                p.getCreatedAt(),
                isVerifiedAdvisor(p.getAuthorId()),
                likedByMe
        );
    }

    @lombok.Data
    @lombok.AllArgsConstructor
    public static class LikeResponse {
        private String postId;
        private boolean liked;
        private int likesCount;
    }

    @lombok.Data
    public static class CreatePostRequest {
        private String threadId;
        private String content;
        private String parentId;
    }
}
