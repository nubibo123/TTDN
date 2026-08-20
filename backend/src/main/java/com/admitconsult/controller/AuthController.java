package com.admitconsult.controller;

import com.admitconsult.config.CookieService;
import com.admitconsult.config.JwtUtil;
import com.admitconsult.dto.*;
import com.admitconsult.entity.User;
import com.admitconsult.entity.UserRoleRecord;
import com.admitconsult.repository.UserRepository;
import com.admitconsult.service.RefreshTokenService;
import com.admitconsult.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authManager;
    private final UserService userService;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final RefreshTokenService refreshTokenService;
    private final CookieService cookieService;

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(
            @RequestBody RegisterRequest request,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse) {
        if (userService.existsByEmail(request.getEmail())) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Email already exists"));
        }

        User user = User.builder()
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .name(request.getName())
                .isActive(true)
                .build();

        User saved = userService.save(user);

        UserRoleRecord role = UserRoleRecord.builder()
                .userId(saved.getId())
                .role(UserRoleRecord.UserRole.STUDENT)
                .isVerified(false)
                .build();
        saved.getRoles().add(role);

        User updated = userService.save(saved);

        String accessToken = jwtUtil.generateToken(updated.getId(), updated.getEmail());
        RefreshTokenService.IssuedToken issued = refreshTokenService.issueNew(
                updated, null,
                httpRequest.getHeader("User-Agent"),
                clientIp(httpRequest));
        cookieService.writeRefreshCookie(httpResponse, issued.rawToken(), refreshTokenService.getRefreshExpirationSeconds());

        AuthResponse response = new AuthResponse(accessToken, updated.getId(), updated.getEmail(), updated.getName());
        return ResponseEntity.ok(ApiResponse.success("Registration successful", response));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(
            @RequestBody LoginRequest request,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse) {
        try {
            authManager.authenticate(new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Invalid credentials"));
        }

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        String accessToken = jwtUtil.generateToken(user.getId(), user.getEmail());
        RefreshTokenService.IssuedToken issued = refreshTokenService.issueNew(
                user, null,
                httpRequest.getHeader("User-Agent"),
                clientIp(httpRequest));
        cookieService.writeRefreshCookie(httpResponse, issued.rawToken(), refreshTokenService.getRefreshExpirationSeconds());

        AuthResponse response = new AuthResponse(accessToken, user.getId(), user.getEmail(), user.getName());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<AuthResponse>> refresh(
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse) {
        String rawCookie = cookieService.readRefreshCookie(httpRequest);
        if (rawCookie == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("No refresh cookie"));
        }
        try {
            RefreshTokenService.RotationResult result = refreshTokenService.rotate(
                    rawCookie,
                    httpRequest.getHeader("User-Agent"),
                    clientIp(httpRequest));
            User user = userRepository.findById(result.newToken().getUserId())
                    .orElseThrow(() -> new UsernameNotFoundException("User not found"));
            String accessToken = jwtUtil.generateToken(user.getId(), user.getEmail());
            cookieService.writeRefreshCookie(httpResponse, result.rawToken(), refreshTokenService.getRefreshExpirationSeconds());
            AuthResponse response = new AuthResponse(accessToken, user.getId(), user.getEmail(), user.getName());
            return ResponseEntity.ok(ApiResponse.success(response));
        } catch (RefreshTokenService.TokenTheftException e) {
            cookieService.clearRefreshCookie(httpResponse);
            return ResponseEntity.status(401).body(ApiResponse.error(e.getMessage()));
        } catch (RefreshTokenService.InvalidRefreshException e) {
            cookieService.clearRefreshCookie(httpResponse);
            return ResponseEntity.status(401).body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<String>> logout(
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse) {
        String rawCookie = cookieService.readRefreshCookie(httpRequest);
        if (rawCookie != null) {
            refreshTokenService.revokeByRawToken(rawCookie);
        }
        cookieService.clearRefreshCookie(httpResponse);
        return ResponseEntity.ok(ApiResponse.success("Logged out"));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<AuthMeResponse>> me(
            @AuthenticationPrincipal UserPrincipal principal) {
        User user = userRepository.findByIdWithRoles(principal.getId())
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
        var roles = user.getRoles().stream()
                .map(r -> r.getRole().name())
                .toList();
        AuthMeResponse res = new AuthMeResponse(
                user.getId(), user.getName(), user.getEmail(),
                user.getAvatarUrl(), roles);
        return ResponseEntity.ok(ApiResponse.success(res));
    }

    @lombok.Data
    @lombok.AllArgsConstructor
    public static class AuthMeResponse {
        private String id;
        private String name;
        private String email;
        private String avatarUrl;
        private java.util.List<String> roles;
    }

    private String clientIp(HttpServletRequest req) {
        String fwd = req.getHeader("X-Forwarded-For");
        if (fwd != null && !fwd.isBlank()) {
            int comma = fwd.indexOf(',');
            return comma > 0 ? fwd.substring(0, comma).trim() : fwd.trim();
        }
        return req.getRemoteAddr();
    }
}
