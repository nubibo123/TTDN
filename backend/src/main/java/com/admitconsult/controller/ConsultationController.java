package com.admitconsult.controller;

import com.admitconsult.dto.ApiResponse;
import com.admitconsult.dto.ConsultationDto;
import com.admitconsult.dto.UserPrincipal;
import com.admitconsult.entity.Consultation;
import com.admitconsult.repository.ConsultationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/consultations")
@RequiredArgsConstructor
public class ConsultationController {

    private final ConsultationRepository consultationRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<List<ConsultationDto>>> getMyConsultations(
            @AuthenticationPrincipal UserPrincipal principal) {
        List<Consultation> list = consultationRepository
                .findByStudentIdOrderByCreatedAtDesc(principal.getId());
        List<ConsultationDto> dtos = list.stream().map(this::toDto).toList();
        return ResponseEntity.ok(ApiResponse.success(dtos));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ConsultationDto>> getById(@PathVariable String id) {
        return consultationRepository.findById(id)
                .map(c -> ResponseEntity.ok(ApiResponse.success(toDto(c))))
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ConsultationDto>> create(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody CreateConsultationRequest request) {

        Consultation consultation = Consultation.builder()
                .studentId(principal.getId())
                .topic(request.getTopic())
                .message(request.getMessage())
                .status(Consultation.ConsultationStatus.PENDING)
                .build();

        Consultation saved = consultationRepository.save(consultation);
        return ResponseEntity.ok(ApiResponse.success("Consultation created", toDto(saved)));
    }

    private ConsultationDto toDto(Consultation c) {
        return new ConsultationDto(
                c.getId(), c.getStudentId(),
                c.getStudent() != null ? c.getStudent().getName() : null,
                c.getAdvisorId(),
                c.getAdvisor() != null ? c.getAdvisor().getTitle() : null,
                c.getTopic(), c.getMessage(),
                c.getStatus().name(), c.getCreatedAt()
        );
    }

    @lombok.Data
    public static class CreateConsultationRequest {
        private String topic;
        private String message;
    }
}