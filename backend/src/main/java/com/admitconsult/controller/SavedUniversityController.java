package com.admitconsult.controller;

import com.admitconsult.dto.ApiResponse;
import com.admitconsult.dto.UserPrincipal;
import com.admitconsult.entity.University;
import com.admitconsult.service.SavedUniversityService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/saved-universities")
@RequiredArgsConstructor
public class SavedUniversityController {

    private final SavedUniversityService savedUniversityService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<University>>> getSavedUniversities(
            @AuthenticationPrincipal UserPrincipal principal) {
        List<University> list = savedUniversityService.getSavedUniversities(principal.getId());
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @GetMapping("/ids")
    public ResponseEntity<ApiResponse<List<String>>> getSavedUniversityIds(
            @AuthenticationPrincipal UserPrincipal principal) {
        List<String> ids = savedUniversityService.getSavedUniversityIds(principal.getId());
        return ResponseEntity.ok(ApiResponse.success(ids));
    }

    @PostMapping("/toggle/{universityId}")
    public ResponseEntity<ApiResponse<Map<String, Boolean>>> toggleSaveUniversity(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String universityId) {
        boolean saved = savedUniversityService.toggleSaveUniversity(principal.getId(), universityId);
        String msg = saved ? "University saved successfully" : "University removed from saved list";
        return ResponseEntity.ok(ApiResponse.success(msg, Map.of("saved", saved)));
    }

    @PostMapping("/sync")
    public ResponseEntity<ApiResponse<List<String>>> syncSavedUniversities(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody List<String> universityIds) {
        savedUniversityService.syncSavedUniversities(principal.getId(), universityIds);
        List<String> updatedIds = savedUniversityService.getSavedUniversityIds(principal.getId());
        return ResponseEntity.ok(ApiResponse.success("Saved universities synced successfully", updatedIds));
    }
}
