package com.admitconsult.controller;

import com.admitconsult.dto.ApiResponse;
import com.admitconsult.dto.BatchSaveTranscriptRequest;
import com.admitconsult.dto.SaveTranscriptRequest;
import com.admitconsult.dto.TranscriptDto;
import com.admitconsult.dto.UserPrincipal;
import com.admitconsult.service.TranscriptService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/transcripts")
@RequiredArgsConstructor
public class TranscriptController {

    private final TranscriptService transcriptService;

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<List<TranscriptDto>>> getMyTranscripts(
            @AuthenticationPrincipal UserPrincipal principal) {
        List<TranscriptDto> transcripts = transcriptService.getMyTranscripts(principal.getId());
        return ResponseEntity.ok(ApiResponse.success(transcripts));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<TranscriptDto>> saveTranscript(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody SaveTranscriptRequest request) {
        TranscriptDto saved = transcriptService.saveTranscript(principal.getId(), request);
        return ResponseEntity.ok(ApiResponse.success("Transcript saved successfully", saved));
    }

    @PostMapping("/batch")
    public ResponseEntity<ApiResponse<List<TranscriptDto>>> saveBatchTranscripts(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody BatchSaveTranscriptRequest request) {
        List<TranscriptDto> savedList = transcriptService.saveBatchTranscripts(principal.getId(), request);
        return ResponseEntity.ok(ApiResponse.success("Transcripts saved successfully", savedList));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteTranscript(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String id) {
        boolean deleted = transcriptService.deleteTranscript(principal.getId(), id);
        if (!deleted) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(ApiResponse.success("Transcript deleted successfully", null));
    }
}
