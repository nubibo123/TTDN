package com.admitconsult.controller;

import com.admitconsult.dto.ApiResponse;
import com.admitconsult.dto.UserPrincipal;
import com.admitconsult.entity.Advisor;
import com.admitconsult.entity.University;
import com.admitconsult.entity.User;
import com.admitconsult.entity.UserRoleRecord;
import com.admitconsult.repository.AdvisorRepository;
import com.admitconsult.repository.UniversityRepository;
import com.admitconsult.repository.UserRepository;
import com.admitconsult.repository.UserRoleRecordRepository;
import com.admitconsult.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/advisors")
@RequiredArgsConstructor
public class AdvisorController {

    private final AdvisorRepository advisorRepository;
    private final UserRepository userRepository;
    private final UserRoleRecordRepository userRoleRecordRepository;
    private final UniversityRepository universityRepository;
    private final UserService userService;
    private final PasswordEncoder passwordEncoder;

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AdvisorResponse>> register(
            @RequestBody RegisterAdvisorRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Email already exists"));
        }

        User user = User.builder()
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .name(request.getName())
                .isActive(true)
                .build();
        User savedUser = userService.save(user);

        UserRoleRecord role = UserRoleRecord.builder()
                .userId(savedUser.getId())
                .role(UserRoleRecord.UserRole.ADVISOR)
                .isVerified(false)
                .build();
        savedUser.getRoles().add(role);
        userService.save(savedUser);

        Advisor advisor = Advisor.builder()
                .userId(savedUser.getId())
                .universityId(request.getUniversityId())
                .title(request.getTitle())
                .bio(request.getBio())
                .build();
        Advisor savedAdvisor = advisorRepository.save(advisor);

        return ResponseEntity.ok(ApiResponse.success(toResponse(savedAdvisor, user, false)));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<AdvisorResponse>> me(@AuthenticationPrincipal UserPrincipal principal) {
        User user = userRepository.findById(principal.getId()).orElse(null);
        if (user == null) {
            return ResponseEntity.notFound().build();
        }
        Advisor advisor = advisorRepository.findByUserId(user.getId()).orElse(null);
        if (advisor == null) {
            return ResponseEntity.ok(ApiResponse.success(null));
        }
        boolean verified = isVerified(user.getId());
        return ResponseEntity.ok(ApiResponse.success(toResponse(advisor, user, verified)));
    }

    @PutMapping("/me")
    public ResponseEntity<ApiResponse<AdvisorResponse>> updateMe(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody UpdateAdvisorRequest request) {
        User user = userRepository.findById(principal.getId()).orElse(null);
        if (user == null) {
            return ResponseEntity.notFound().build();
        }
        Advisor advisor = advisorRepository.findByUserId(user.getId()).orElse(null);
        if (advisor == null) {
            return ResponseEntity.notFound().build();
        }
        if (request.getUniversityId() != null && !request.getUniversityId().isBlank()) {
            advisor.setUniversityId(request.getUniversityId());
        }
        if (request.getTitle() != null) {
            advisor.setTitle(request.getTitle());
        }
        if (request.getBio() != null) {
            advisor.setBio(request.getBio());
        }
        Advisor saved = advisorRepository.save(advisor);
        boolean verified = isVerified(user.getId());
        return ResponseEntity.ok(ApiResponse.success(toResponse(saved, user, verified)));
    }

    private boolean isVerified(String userId) {
        return userRoleRecordRepository.findByUserId(userId).stream()
                .filter(r -> r.getRole() == UserRoleRecord.UserRole.ADVISOR)
                .anyMatch(r -> Boolean.TRUE.equals(r.getIsVerified()));
    }

    private AdvisorResponse toResponse(Advisor advisor, User user, boolean verified) {
        String universityName = null;
        if (advisor.getUniversityId() != null) {
            University uni = universityRepository.findById(advisor.getUniversityId()).orElse(null);
            universityName = uni != null ? uni.getName() : null;
        }
        return new AdvisorResponse(
                advisor.getId(),
                user.getName(),
                user.getEmail(),
                advisor.getUniversityId(),
                universityName,
                advisor.getTitle(),
                advisor.getBio(),
                verified);
    }

    @lombok.Data
    @lombok.AllArgsConstructor
    public static class AdvisorResponse {
        private String id;
        private String name;
        private String email;
        private String universityId;
        private String universityName;
        private String title;
        private String bio;
        private boolean verified;
    }

    @lombok.Data
    public static class RegisterAdvisorRequest {
        private String name;
        private String email;
        private String password;
        private String universityId;
        private String title;
        private String bio;
    }

    @lombok.Data
    public static class UpdateAdvisorRequest {
        private String universityId;
        private String title;
        private String bio;
    }
}
