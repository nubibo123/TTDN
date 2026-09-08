package com.admitconsult.controller;

import com.admitconsult.dto.ApiResponse;
import com.admitconsult.dto.UserPrincipal;
import com.admitconsult.entity.User;
import com.admitconsult.entity.StudentProfile;
import com.admitconsult.entity.Advisor;
import com.admitconsult.dto.TranscriptDto;
import com.admitconsult.repository.AdvisorRepository;
import com.admitconsult.repository.StudentProfileRepository;
import com.admitconsult.repository.TranscriptRepository;
import com.admitconsult.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/profile")
@RequiredArgsConstructor
public class ProfileController {

    private final UserRepository userRepository;
    private final StudentProfileRepository studentProfileRepository;
    private final TranscriptRepository transcriptRepository;
    private final AdvisorRepository advisorRepository;

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<ProfileController.ProfileDto>> getMe(
            @AuthenticationPrincipal UserPrincipal principal) {
        User user = userRepository.findById(principal.getId()).orElse(null);
        if (user == null)
            return ResponseEntity.notFound().build();

        ProfileDto dto = new ProfileDto(
                user.getId(), user.getName(), user.getEmail(),
                user.getAvatarUrl(), user.getIsActive());
        return ResponseEntity.ok(ApiResponse.success(dto));
    }

    @GetMapping("/users/{userId}")
    public ResponseEntity<ApiResponse<PublicProfileDto>> getPublicProfile(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String userId) {
        User user = userRepository.findById(userId).orElse(null);
        Advisor advisor = advisorRepository.findByUserId(userId).orElse(null);
        StudentProfile profile = studentProfileRepository.findByUserId(userId).orElse(null);
        if (user == null) {
            return ResponseEntity.notFound().build();
        }

        boolean isOwner = principal != null && userId.equals(principal.getId());
        if (advisor != null) {
            return ResponseEntity.ok(ApiResponse.success(new PublicProfileDto(
                user.getId(), user.getName(), user.getAvatarUrl(), null, null, false, List.of(),
                "ADVISOR", advisor.getTitle(), advisor.getBio(),
                advisor.getUniversity() != null ? advisor.getUniversity().getName() : null,
                advisor.getUniversityId() != null, null)));
        }
        if (profile == null) {
            return ResponseEntity.ok(ApiResponse.success(new PublicProfileDto(
                user.getId(), user.getName(), user.getAvatarUrl(), null, null, false, List.of(),
                "STUDENT", null, null, null, false, null)));
        }
        if (!isOwner && !Boolean.TRUE.equals(profile.getIsProfilePublic())) {
            return ResponseEntity.status(403).body(ApiResponse.error("Hồ sơ này đang ở chế độ riêng tư"));
        }

        List<TranscriptDto> transcripts = Boolean.TRUE.equals(profile.getShowGrades()) || isOwner
                ? transcriptRepository.findByStudentIdOrderByYearAsc(userId).stream()
                    .map(TranscriptDto::fromEntity).toList()
                : List.of();

        return ResponseEntity.ok(ApiResponse.success(new PublicProfileDto(
                user.getId(), user.getName(), user.getAvatarUrl(), profile.getGraduationYear(),
                profile.getProvince(), Boolean.TRUE.equals(profile.getShowGrades()) || isOwner,
                transcripts, "STUDENT", null, null, null, false, null)));
    }

    @lombok.Data
    @lombok.AllArgsConstructor
    public static class ProfileDto {
        private String id;
        private String name;
        private String email;
        private String avatarUrl;
        private Boolean isActive;
    }

    @lombok.Data
    @lombok.AllArgsConstructor
    public static class PublicProfileDto {
        private String id;
        private String name;
        private String avatarUrl;
        private Integer graduationYear;
        private String province;
        private Boolean gradesVisible;
        private List<TranscriptDto> transcripts;
        private String role;
        private String title;
        private String bio;
        private String universityName;
        private Boolean verified;
        private String universityId;
    }
}