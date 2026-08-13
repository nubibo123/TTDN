package com.admitconsult.controller;

import com.admitconsult.dto.ApiResponse;
import com.admitconsult.dto.UserPrincipal;
import com.admitconsult.entity.User;
import com.admitconsult.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/profile")
@RequiredArgsConstructor
public class ProfileController {

    private final UserRepository userRepository;

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

    @lombok.Data
    @lombok.AllArgsConstructor
    public static class ProfileDto {
        private String id;
        private String name;
        private String email;
        private String avatarUrl;
        private Boolean isActive;
    }
}