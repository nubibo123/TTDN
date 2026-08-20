package com.admitconsult.controller;

import com.admitconsult.dto.ApiResponse;
import com.admitconsult.dto.UserPrincipal;
import com.admitconsult.entity.*;
import com.admitconsult.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final UserRepository userRepository;
    private final UserRoleRecordRepository userRoleRecordRepository;
    private final ConsultationRepository consultationRepository;
    private final ForumPostRepository forumPostRepository;
    private final AdvisorRepository advisorRepository;
    private final UniversityRepository universityRepository;
    private final ForumThreadRepository forumThreadRepository;
    private final AcademicYearRepository academicYearRepository;
    private final SystemSettingRepository systemSettingRepository;
    private final AdmissionScoreRepository admissionScoreRepository;
    private final ForumCategoryRepository forumCategoryRepository;

    private void assertAdmin(UserPrincipal principal) {
        boolean isAdmin = userRoleRecordRepository.findByUserId(principal.getId()).stream()
                .anyMatch(r -> r.getRole() == UserRoleRecord.UserRole.ADMIN);
        if (!isAdmin) {
            throw new org.springframework.security.access.AccessDeniedException("Admin only");
        }
    }

    private boolean isAdvisorPending(Advisor a) {
        if (a.getUser() == null) return false;
        return a.getUser().getRoles().stream()
                .filter(r -> r.getRole() == UserRoleRecord.UserRole.ADVISOR)
                .findFirst()
                .map(r -> !Boolean.TRUE.equals(r.getIsVerified()))
                .orElse(true);
    }

    // ── Stats ──

    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<StatsResponse>> stats(@AuthenticationPrincipal UserPrincipal principal) {
        assertAdmin(principal);
        long totalStudents = userRepository.count();
        long totalUniversities = universityRepository.count();
        long totalConsultations = consultationRepository.count();
        long totalPosts = forumPostRepository.count();
        long pendingAdvisors = advisorRepository.findAll().stream()
                .filter(this::isAdvisorPending)
                .count();

        StatsResponse res = new StatsResponse(
                totalStudents, totalUniversities, totalConsultations, totalPosts, pendingAdvisors
        );
        return ResponseEntity.ok(ApiResponse.success(res));
    }

    // ── Users ──

    @GetMapping("/users")
    public ResponseEntity<ApiResponse<List<UserSummary>>> users(@AuthenticationPrincipal UserPrincipal principal) {
        assertAdmin(principal);
        List<UserSummary> list = userRepository.findAll().stream()
                .map(u -> {
                    List<String> roles = u.getRoles().stream()
                            .map(r -> r.getRole().name())
                            .collect(Collectors.toList());
                    return new UserSummary(
                            u.getId(), u.getName(), u.getEmail(),
                            u.getIsActive(), roles, u.getCreatedAt()
                    );
                })
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @PutMapping("/users/{userId}/roles")
    public ResponseEntity<ApiResponse<UserSummary>> updateUserRoles(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String userId,
            @RequestBody UpdateRolesRequest request) {
        assertAdmin(principal);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NoSuchElementException("User not found"));
        user.getRoles().clear();
        for (String roleName : request.getRoles()) {
            UserRoleRecord.UserRole role = UserRoleRecord.UserRole.valueOf(roleName);
            user.getRoles().add(UserRoleRecord.builder()
                    .userId(user.getId())
                    .role(role)
                    .isVerified(role == UserRoleRecord.UserRole.ADVISOR || role == UserRoleRecord.UserRole.ADMIN)
                    .build());
        }
        User saved = userRepository.save(user);
        List<String> roles = saved.getRoles().stream()
                .map(r -> r.getRole().name())
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(new UserSummary(
                saved.getId(), saved.getName(), saved.getEmail(),
                saved.getIsActive(), roles, saved.getCreatedAt()
        )));
    }

    @PutMapping("/users/{userId}/toggle-active")
    public ResponseEntity<ApiResponse<UserSummary>> toggleUserActive(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String userId) {
        assertAdmin(principal);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NoSuchElementException("User not found"));
        user.setIsActive(!user.getIsActive());
        User saved = userRepository.save(user);
        List<String> roles = saved.getRoles().stream()
                .map(r -> r.getRole().name())
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(new UserSummary(
                saved.getId(), saved.getName(), saved.getEmail(),
                saved.getIsActive(), roles, saved.getCreatedAt()
        )));
    }

    // ── Advisors ──

    @GetMapping("/advisors/pending")
    public ResponseEntity<ApiResponse<List<AdvisorSummary>>> pendingAdvisors(@AuthenticationPrincipal UserPrincipal principal) {
        assertAdmin(principal);
        List<AdvisorSummary> list = advisorRepository.findAll().stream()
                .filter(this::isAdvisorPending)
                .map(a -> new AdvisorSummary(
                        a.getId(),
                        a.getUser() != null ? a.getUser().getName() : null,
                        a.getUser() != null ? a.getUser().getEmail() : null,
                        a.getUniversity() != null ? a.getUniversity().getName() : null,
                        a.getTitle(), a.getBio()
                ))
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @GetMapping("/advisors")
    public ResponseEntity<ApiResponse<List<AdvisorSummary>>> allAdvisors(@AuthenticationPrincipal UserPrincipal principal) {
        assertAdmin(principal);
        List<AdvisorSummary> list = advisorRepository.findAll().stream()
                .map(a -> new AdvisorSummary(
                        a.getId(),
                        a.getUser() != null ? a.getUser().getName() : null,
                        a.getUser() != null ? a.getUser().getEmail() : null,
                        a.getUniversity() != null ? a.getUniversity().getName() : null,
                        a.getTitle(), a.getBio()
                ))
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @PutMapping("/advisors/{id}/verify")
    public ResponseEntity<ApiResponse<AdvisorSummary>> verifyAdvisor(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String id,
            @RequestBody VerifyAdvisorRequest request) {
        assertAdmin(principal);
        Advisor advisor = advisorRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Advisor not found"));
        User user = advisor.getUser();
        if (user != null) {
            Optional<UserRoleRecord> advisorRole = user.getRoles().stream()
                    .filter(r -> r.getRole() == UserRoleRecord.UserRole.ADVISOR)
                    .findFirst();
            if (advisorRole.isPresent()) {
                advisorRole.get().setIsVerified(request.getVerified());
            } else {
                user.getRoles().add(UserRoleRecord.builder()
                        .userId(user.getId())
                        .role(UserRoleRecord.UserRole.ADVISOR)
                        .isVerified(request.getVerified())
                        .build());
            }
            userRepository.save(user);
        }
        AdvisorSummary res = new AdvisorSummary(
                advisor.getId(),
                user != null ? user.getName() : null,
                user != null ? user.getEmail() : null,
                advisor.getUniversity() != null ? advisor.getUniversity().getName() : null,
                advisor.getTitle(), advisor.getBio()
        );
        return ResponseEntity.ok(ApiResponse.success(res));
    }

    // ── Consultations ──

    @GetMapping("/consultations")
    public ResponseEntity<ApiResponse<List<ConsultationSummary>>> consultations(@AuthenticationPrincipal UserPrincipal principal) {
        assertAdmin(principal);
        List<ConsultationSummary> list = consultationRepository.findAll().stream()
                .sorted(Comparator.comparing(Consultation::getCreatedAt).reversed())
                .map(c -> new ConsultationSummary(
                        c.getId(), c.getStudentId(),
                        c.getStudent() != null ? c.getStudent().getName() : null,
                        c.getAdvisorId(),
                        c.getAdvisor() != null ? c.getAdvisor().getTitle() : null,
                        c.getTopic(), c.getMessage(), c.getStatus().name(), c.getCreatedAt()
                ))
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @PutMapping("/consultations/{id}/status")
    public ResponseEntity<ApiResponse<ConsultationSummary>> updateConsultationStatus(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String id,
            @RequestBody UpdateConsultationStatusRequest request) {
        assertAdmin(principal);
        Consultation c = consultationRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Consultation not found"));
        c.setStatus(Consultation.ConsultationStatus.valueOf(request.getStatus()));
        Consultation saved = consultationRepository.save(c);
        return ResponseEntity.ok(ApiResponse.success(new ConsultationSummary(
                saved.getId(), saved.getStudentId(),
                saved.getStudent() != null ? saved.getStudent().getName() : null,
                saved.getAdvisorId(),
                saved.getAdvisor() != null ? saved.getAdvisor().getTitle() : null,
                saved.getTopic(), saved.getMessage(), saved.getStatus().name(), saved.getCreatedAt()
        )));
    }

    // ── Forum Posts ──

    @GetMapping("/forum-posts")
    public ResponseEntity<ApiResponse<List<ForumPostSummary>>> forumPosts(@AuthenticationPrincipal UserPrincipal principal) {
        assertAdmin(principal);
        List<ForumPostSummary> list = forumPostRepository.findAll().stream()
                .sorted(Comparator.comparing(ForumPost::getCreatedAt).reversed())
                .map(p -> new ForumPostSummary(
                        p.getId(), p.getThreadId(),
                        p.getThread() != null ? p.getThread().getTitle() : null,
                        p.getAuthorId(),
                        p.getAuthor() != null ? p.getAuthor().getName() : null,
                        p.getContent(), p.getIsDeleted(), p.getCreatedAt()
                ))
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @DeleteMapping("/forum-posts/{id}")
    public ResponseEntity<ApiResponse<String>> deleteForumPost(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String id) {
        assertAdmin(principal);
        ForumPost post = forumPostRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Post not found"));
        post.setIsDeleted(true);
        forumPostRepository.save(post);
        return ResponseEntity.ok(ApiResponse.success("Deleted"));
    }

    // ── Forum Threads ──

    @GetMapping("/forum-threads")
    public ResponseEntity<ApiResponse<List<ForumThreadSummary>>> forumThreads(@AuthenticationPrincipal UserPrincipal principal) {
        assertAdmin(principal);
        List<ForumThreadSummary> list = forumThreadRepository.findAll().stream()
                .sorted(Comparator.comparing(ForumThread::getCreatedAt).reversed())
                .map(t -> new ForumThreadSummary(
                        t.getId(), t.getCategoryId(),
                        t.getCategory() != null ? t.getCategory().getName() : null,
                        t.getTitle(), t.getAuthorId(),
                        t.getAuthor() != null ? t.getAuthor().getName() : null,
                        t.getIsPinned(), t.getIsLocked(), t.getCreatedAt()
                ))
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @DeleteMapping("/forum-threads/{id}")
    public ResponseEntity<ApiResponse<String>> deleteForumThread(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String id) {
        assertAdmin(principal);
        forumThreadRepository.deleteById(id);
        return ResponseEntity.ok(ApiResponse.success("Deleted"));
    }

    // ── Forum Categories ──

    @GetMapping("/forum-categories")
    public ResponseEntity<ApiResponse<List<ForumCategorySummary>>> adminForumCategories(
            @AuthenticationPrincipal UserPrincipal principal) {
        assertAdmin(principal);
        List<ForumCategorySummary> list = forumCategoryRepository.findAll().stream()
                .sorted(Comparator.comparing(ForumCategory::getDisplayOrder))
                .map(c -> new ForumCategorySummary(c.getId(), c.getName(), c.getSlug(), c.getDisplayOrder()))
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @PostMapping("/forum-categories")
    public ResponseEntity<ApiResponse<ForumCategorySummary>> createForumCategory(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody CreateForumCategoryRequest request) {
        assertAdmin(principal);
        if (request.getName() == null || request.getName().isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Name is required"));
        }
        if (request.getSlug() == null || request.getSlug().isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Slug is required"));
        }
        if (forumCategoryRepository.findBySlug(request.getSlug()).isPresent()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Slug already exists"));
        }
        ForumCategory category = ForumCategory.builder()
                .name(request.getName().trim())
                .slug(request.getSlug().trim())
                .displayOrder(request.getDisplayOrder() != null ? request.getDisplayOrder() : 0)
                .build();
        ForumCategory saved = forumCategoryRepository.save(category);
        return ResponseEntity.ok(ApiResponse.success(new ForumCategorySummary(
                saved.getId(), saved.getName(), saved.getSlug(), saved.getDisplayOrder())));
    }

    @DeleteMapping("/forum-categories/{id}")
    public ResponseEntity<ApiResponse<String>> deleteForumCategory(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String id) {
        assertAdmin(principal);
        forumCategoryRepository.deleteById(id);
        return ResponseEntity.ok(ApiResponse.success("Deleted"));
    }

    // ── Academic Years ──

    @GetMapping("/academic-years")
    public ResponseEntity<ApiResponse<List<AcademicYearSummary>>> academicYears(@AuthenticationPrincipal UserPrincipal principal) {
        assertAdmin(principal);
        List<AcademicYearSummary> list = academicYearRepository.findAll().stream()
                .sorted(Comparator.comparing(AcademicYear::getYear).reversed())
                .map(y -> new AcademicYearSummary(y.getId(), y.getYear(), y.getIsActive(), y.getCreatedAt()))
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @PostMapping("/academic-years")
    public ResponseEntity<ApiResponse<AcademicYearSummary>> createAcademicYear(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody CreateAcademicYearRequest request) {
        assertAdmin(principal);
        AcademicYear year = AcademicYear.builder()
                .year(request.getYear())
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .build();
        AcademicYear saved = academicYearRepository.save(year);
        return ResponseEntity.ok(ApiResponse.success(new AcademicYearSummary(saved.getId(), saved.getYear(), saved.getIsActive(), saved.getCreatedAt())));
    }

    @PutMapping("/academic-years/{id}")
    public ResponseEntity<ApiResponse<AcademicYearSummary>> updateAcademicYear(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String id,
            @RequestBody CreateAcademicYearRequest request) {
        assertAdmin(principal);
        AcademicYear year = academicYearRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("AcademicYear not found"));
        year.setYear(request.getYear());
        if (request.getIsActive() != null) {
            year.setIsActive(request.getIsActive());
        }
        AcademicYear saved = academicYearRepository.save(year);
        return ResponseEntity.ok(ApiResponse.success(new AcademicYearSummary(saved.getId(), saved.getYear(), saved.getIsActive(), saved.getCreatedAt())));
    }

    @DeleteMapping("/academic-years/{id}")
    public ResponseEntity<ApiResponse<String>> deleteAcademicYear(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String id) {
        assertAdmin(principal);
        academicYearRepository.deleteById(id);
        return ResponseEntity.ok(ApiResponse.success("Deleted"));
    }

    // ── System Settings ──

    @GetMapping("/settings")
    public ResponseEntity<ApiResponse<Map<String, String>>> settings(@AuthenticationPrincipal UserPrincipal principal) {
        assertAdmin(principal);
        Map<String, String> map = systemSettingRepository.findAll().stream()
                .collect(Collectors.toMap(SystemSetting::getKey, SystemSetting::getValue));
        return ResponseEntity.ok(ApiResponse.success(map));
    }

    @PutMapping("/settings/{key}")
    public ResponseEntity<ApiResponse<SystemSettingSummary>> updateSetting(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String key,
            @RequestBody UpdateSettingRequest request) {
        assertAdmin(principal);
        SystemSetting setting = systemSettingRepository.findByKey(key)
                .orElseGet(() -> SystemSetting.builder().key(key).value("").build());
        setting.setValue(request.getValue());
        SystemSetting saved = systemSettingRepository.save(setting);
        return ResponseEntity.ok(ApiResponse.success(new SystemSettingSummary(saved.getKey(), saved.getValue())));
    }

    // ── Universities ──

    @GetMapping("/universities")
    public ResponseEntity<ApiResponse<List<UniversitySummary>>> adminUniversities(@AuthenticationPrincipal UserPrincipal principal) {
        assertAdmin(principal);
        List<UniversitySummary> list = universityRepository.findAll().stream()
                .sorted(Comparator.comparing(University::getName))
                .map(u -> new UniversitySummary(
                        u.getId(), u.getCode(), u.getName(), u.getRegion().name(),
                        u.getType().name(), u.getAddress(), u.getWebsiteUrl(),
                        u.getTuitionRange(), u.getIsVerified(), u.getCreatedAt()
                ))
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @PutMapping("/universities/{id}")
    public ResponseEntity<ApiResponse<UniversitySummary>> updateUniversity(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String id,
            @RequestBody UpdateUniversityRequest request) {
        assertAdmin(principal);
        University u = universityRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("University not found"));
        if (request.getCode() != null) u.setCode(request.getCode());
        if (request.getName() != null) u.setName(request.getName());
        if (request.getRegion() != null) u.setRegion(University.UniversityRegion.valueOf(request.getRegion()));
        if (request.getType() != null) u.setType(University.UniversityType.valueOf(request.getType()));
        if (request.getAddress() != null) u.setAddress(request.getAddress());
        if (request.getWebsiteUrl() != null) u.setWebsiteUrl(request.getWebsiteUrl());
        if (request.getTuitionRange() != null) u.setTuitionRange(request.getTuitionRange());
        if (request.getIsVerified() != null) u.setIsVerified(request.getIsVerified());
        University saved = universityRepository.save(u);
        return ResponseEntity.ok(ApiResponse.success(new UniversitySummary(
                saved.getId(), saved.getCode(), saved.getName(), saved.getRegion().name(),
                saved.getType().name(), saved.getAddress(), saved.getWebsiteUrl(),
                saved.getTuitionRange(), saved.getIsVerified(), saved.getCreatedAt()
        )));
    }

    // ── Admission Scores ──

    @GetMapping("/admission-scores")
    public ResponseEntity<ApiResponse<List<AdmissionScoreSummary>>> admissionScores(@AuthenticationPrincipal UserPrincipal principal) {
        assertAdmin(principal);
        List<AdmissionScoreSummary> list = admissionScoreRepository.findAll().stream()
                .sorted(Comparator.comparing(AdmissionScore::getYear).reversed())
                .map(s -> new AdmissionScoreSummary(
                        s.getId(),
                        s.getMajor() != null ? s.getMajor().getId() : null,
                        s.getMajor() != null ? s.getMajor().getName() : null,
                        s.getYear(), s.getMethod(), s.getScore(), s.getNote(), s.getUrl()
                ))
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @PostMapping("/admission-scores")
    public ResponseEntity<ApiResponse<AdmissionScoreSummary>> createAdmissionScore(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody CreateAdmissionScoreRequest request) {
        assertAdmin(principal);
        AdmissionScore score = AdmissionScore.builder()
                .major(new Major() {{ setId(request.getMajorId()); }})
                .year(request.getYear())
                .method(request.getMethod() != null ? request.getMethod() : "Điểm thi THPT")
                .score(request.getScore())
                .note(request.getNote())
                .url(request.getUrl())
                .build();
        AdmissionScore saved = admissionScoreRepository.save(score);
        return ResponseEntity.ok(ApiResponse.success(new AdmissionScoreSummary(
                saved.getId(), saved.getMajor() != null ? saved.getMajor().getId() : null,
                saved.getMajor() != null ? saved.getMajor().getName() : null,
                saved.getYear(), saved.getMethod(), saved.getScore(), saved.getNote(), saved.getUrl()
        )));
    }

    // ── DTOs ──

    @lombok.Data
    @lombok.AllArgsConstructor
    public static class StatsResponse {
        private long totalStudents;
        private long totalUniversities;
        private long totalConsultations;
        private long totalPosts;
        private long pendingAdvisors;
    }

    @lombok.Data
    @lombok.AllArgsConstructor
    public static class UserSummary {
        private String id;
        private String name;
        private String email;
        private Boolean isActive;
        private List<String> roles;
        private java.time.LocalDateTime createdAt;
    }

    @lombok.Data
    public static class UpdateRolesRequest {
        private List<String> roles;
    }

    @lombok.Data
    @lombok.AllArgsConstructor
    public static class ConsultationSummary {
        private String id;
        private String studentId;
        private String studentName;
        private String advisorId;
        private String advisorTitle;
        private String topic;
        private String message;
        private String status;
        private java.time.LocalDateTime createdAt;
    }

    @lombok.Data
    public static class UpdateConsultationStatusRequest {
        private String status;
    }

    @lombok.Data
    @lombok.AllArgsConstructor
    public static class ForumPostSummary {
        private String id;
        private String threadId;
        private String threadTitle;
        private String authorId;
        private String authorName;
        private String content;
        private Boolean isDeleted;
        private java.time.LocalDateTime createdAt;
    }

    @lombok.Data
    @lombok.AllArgsConstructor
    public static class ForumThreadSummary {
        private String id;
        private String categoryId;
        private String categoryName;
        private String title;
        private String authorId;
        private String authorName;
        private Boolean isPinned;
        private Boolean isLocked;
        private java.time.LocalDateTime createdAt;
    }

    @lombok.Data
    @lombok.AllArgsConstructor
    public static class ForumCategorySummary {
        private String id;
        private String name;
        private String slug;
        private Integer displayOrder;
    }

    @lombok.Data
    public static class CreateForumCategoryRequest {
        private String name;
        private String slug;
        private Integer displayOrder;
    }

    @lombok.Data
    @lombok.AllArgsConstructor
    public static class AdvisorSummary {
        private String id;
        private String name;
        private String email;
        private String university;
        private String title;
        private String bio;
    }

    @lombok.Data
    public static class VerifyAdvisorRequest {
        private Boolean verified;
    }

    @lombok.Data
    @lombok.AllArgsConstructor
    public static class AcademicYearSummary {
        private String id;
        private String year;
        private Boolean isActive;
        private java.time.LocalDateTime createdAt;
    }

    @lombok.Data
    public static class CreateAcademicYearRequest {
        private String year;
        private Boolean isActive;
    }

    @lombok.Data
    @lombok.AllArgsConstructor
    public static class SystemSettingSummary {
        private String key;
        private String value;
    }

    @lombok.Data
    public static class UpdateSettingRequest {
        private String value;
    }

    @lombok.Data
    @lombok.AllArgsConstructor
    public static class UniversitySummary {
        private String id;
        private String code;
        private String name;
        private String region;
        private String type;
        private String address;
        private String websiteUrl;
        private String tuitionRange;
        private Boolean isVerified;
        private java.time.LocalDateTime createdAt;
    }

    @lombok.Data
    public static class UpdateUniversityRequest {
        private String code;
        private String name;
        private String region;
        private String type;
        private String address;
        private String websiteUrl;
        private String tuitionRange;
        private Boolean isVerified;
    }

    @lombok.Data
    @lombok.AllArgsConstructor
    public static class AdmissionScoreSummary {
        private String id;
        private String majorId;
        private String majorName;
        private Integer year;
        private String method;
        private java.math.BigDecimal score;
        private String note;
        private String url;
    }

    @lombok.Data
    public static class CreateAdmissionScoreRequest {
        private String majorId;
        private Integer year;
        private String method;
        private java.math.BigDecimal score;
        private String note;
        private String url;
    }
}
