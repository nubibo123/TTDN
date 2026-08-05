package com.admitconsult.service;

import com.admitconsult.entity.RefreshToken;
import com.admitconsult.entity.User;
import com.admitconsult.repository.RefreshTokenRepository;
import com.admitconsult.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class RefreshTokenService {

    private static final SecureRandom RNG = new SecureRandom();

    private final RefreshTokenRepository refreshTokenRepository;
    private final UserRepository userRepository;

    @Value("${jwt.refresh-expiration}")
    private long refreshExpirationMs;

    public record RotationResult(RefreshToken newToken, String rawToken, boolean wasTheft) {}

    public String getRefreshExpirationSeconds() {
        return String.valueOf(refreshExpirationMs / 1000);
    }

    public record IssuedToken(RefreshToken record, String rawToken) {}

    @Transactional
    public IssuedToken issueNew(User user, String familyId, String userAgent, String ipAddress) {
        String rawToken = generateOpaqueToken();
        String hash = sha256(rawToken);
        String fid = familyId != null ? familyId : UUID.randomUUID().toString();
        Instant now = Instant.now();
        Instant expiresAt = now.plusMillis(refreshExpirationMs);

        RefreshToken token = RefreshToken.builder()
                .userId(user.getId())
                .tokenHash(hash)
                .familyId(fid)
                .expiresAt(expiresAt)
                .userAgent(userAgent)
                .ipAddress(ipAddress)
                .build();
        RefreshToken saved = refreshTokenRepository.save(token);
        return new IssuedToken(saved, rawToken);
    }

    @Transactional
    public RotationResult rotate(String presentedRawToken, String userAgent, String ipAddress) {
        if (presentedRawToken == null || presentedRawToken.isBlank()) {
            throw new InvalidRefreshException("Missing refresh token");
        }
        String hash = sha256(presentedRawToken);
        Optional<RefreshToken> existingOpt = refreshTokenRepository.findByTokenHash(hash);

        if (existingOpt.isEmpty()) {
            throw new InvalidRefreshException("Refresh token not recognised");
        }
        RefreshToken existing = existingOpt.get();
        Instant now = Instant.now();

        if (existing.getRevokedAt() != null) {
            log.warn("Refresh-token reuse detected for familyId={}, userId={}", existing.getFamilyId(), existing.getUserId());
            refreshTokenRepository.revokeFamily(existing.getFamilyId(), now);
            throw new TokenTheftException("Refresh token reuse detected — all sessions revoked");
        }

        if (existing.getExpiresAt().isBefore(now)) {
            existing.setRevokedAt(now);
            refreshTokenRepository.save(existing);
            throw new InvalidRefreshException("Refresh token expired");
        }

        User user = userRepository.findById(existing.getUserId())
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        IssuedToken fresh = issueNew(user, existing.getFamilyId(), userAgent, ipAddress);
        existing.setRevokedAt(now);
        existing.setReplacedById(fresh.record().getId());
        refreshTokenRepository.save(existing);

        return new RotationResult(fresh.record(), fresh.rawToken(), false);
    }

    @Transactional
    public void revokeByRawToken(String presentedRawToken) {
        if (presentedRawToken == null || presentedRawToken.isBlank()) return;
        String hash = sha256(presentedRawToken);
        refreshTokenRepository.findByTokenHash(hash).ifPresent(rt -> {
            if (rt.getRevokedAt() == null) {
                rt.setRevokedAt(Instant.now());
                refreshTokenRepository.save(rt);
            }
        });
    }

    @Transactional
    public int revokeAllForUser(String userId) {
        return refreshTokenRepository.revokeAllByUserId(userId, Instant.now());
    }

    @Transactional
    public int purgeExpired() {
        return refreshTokenRepository.deleteExpired(Instant.now());
    }

    private String generateOpaqueToken() {
        byte[] bytes = new byte[48];
        RNG.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    public static String sha256(String input) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] digest = md.digest(input.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder(digest.length * 2);
            for (byte b : digest) sb.append(String.format("%02x", b));
            return sb.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 unavailable", e);
        }
    }

    public static class InvalidRefreshException extends RuntimeException {
        public InvalidRefreshException(String msg) { super(msg); }
    }

    public static class TokenTheftException extends RuntimeException {
        public TokenTheftException(String msg) { super(msg); }
    }
}
