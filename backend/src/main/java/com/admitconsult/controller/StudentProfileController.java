package com.admitconsult.controller;

import com.admitconsult.dto.ApiResponse;
import com.admitconsult.dto.UserPrincipal;
import com.admitconsult.entity.StudentProfile;
import com.admitconsult.entity.User;
import com.admitconsult.repository.UserRepository;
import com.admitconsult.service.StudentProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/student-profile")
@RequiredArgsConstructor
public class StudentProfileController {

    private final StudentProfileService studentProfileService;
    private final UserRepository userRepository;

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<StudentProfileDto>> getMe(
            @AuthenticationPrincipal UserPrincipal principal) {
        StudentProfile profile = studentProfileService.getOrCreateForUser(principal);
        User user = userRepository.findById(principal.getId()).orElse(null);
        String avatarUrl = user != null ? user.getAvatarUrl() : null;
        return ResponseEntity.ok(ApiResponse.success(toDto(profile, avatarUrl)));
    }

    @PutMapping("/me")
    public ResponseEntity<ApiResponse<StudentProfileDto>> updateMe(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody UpdateStudentProfileRequest request) {
        StudentProfile existing = studentProfileService.getOrCreateForUser(principal);
        StudentProfile updated = StudentProfile.builder()
                .id(existing.getId())
                .userId(principal.getId())
                .graduationYear(request.getGraduationYear())
                .province(request.getProvince())
                .isProfilePublic(request.getIsProfilePublic())
                .showGrades(request.getShowGrades())
                .allowContact(request.getAllowContact())
                .showInForum(request.getShowInForum())
                .build();
        StudentProfile saved = studentProfileService.update(existing, updated);
        User user = userRepository.findById(principal.getId()).orElse(null);
        String avatarUrl = user != null ? user.getAvatarUrl() : null;
        return ResponseEntity.ok(ApiResponse.success(toDto(saved, avatarUrl)));
    }

    private StudentProfileDto toDto(StudentProfile profile, String avatarUrl) {
        return new StudentProfileDto(
                profile.getId(),
                profile.getUserId(),
                profile.getGraduationYear(),
                profile.getProvince(),
                avatarUrl,
                profile.getIsProfilePublic(),
                profile.getShowGrades(),
                profile.getAllowContact(),
                profile.getShowInForum()
        );
    }

    @lombok.Data
    @lombok.AllArgsConstructor
    public static class StudentProfileDto {
        private String id;
        private String userId;
        private Integer graduationYear;
        private String province;
        private String avatarUrl;
        private Boolean isProfilePublic;
        private Boolean showGrades;
        private Boolean allowContact;
        private Boolean showInForum;
    }

    @lombok.Data
    public static class UpdateStudentProfileRequest {
        private Integer graduationYear;
        private String province;
        private Boolean isProfilePublic;
        private Boolean showGrades;
        private Boolean allowContact;
        private Boolean showInForum;
    }
}
