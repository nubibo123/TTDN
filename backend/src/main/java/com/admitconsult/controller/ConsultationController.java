package com.admitconsult.controller;

import com.admitconsult.dto.ApiResponse;
import com.admitconsult.dto.ConsultationDto;
import com.admitconsult.dto.ConsultationMessageDto;
import com.admitconsult.dto.UserPrincipal;
import com.admitconsult.entity.Consultation;
import com.admitconsult.entity.ConsultationMessage;
import com.admitconsult.entity.User;
import com.admitconsult.repository.AdvisorRepository;
import com.admitconsult.repository.ConsultationMessageRepository;
import com.admitconsult.repository.ConsultationRepository;
import com.admitconsult.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

import org.springframework.transaction.annotation.Transactional;

@RestController
@RequestMapping("/api/consultations")
@RequiredArgsConstructor
@Transactional
public class ConsultationController {

    private final ConsultationRepository consultationRepository;
    private final ConsultationMessageRepository consultationMessageRepository;
    private final UserRepository userRepository;
    private final AdvisorRepository advisorRepository;
    private final com.admitconsult.repository.UniversityRepository universityRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<List<ConsultationDto>>> getMyConsultations(
            @AuthenticationPrincipal UserPrincipal principal) {
        if (principal == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("Authentication required"));
        }
        List<Consultation> list = consultationRepository
                .findByStudentIdOrderByCreatedAtDesc(principal.getId());
        List<ConsultationDto> dtos = list.stream().map(this::toDto).toList();
        return ResponseEntity.ok(ApiResponse.success(dtos));
    }

    @GetMapping("/advisor")
    public ResponseEntity<ApiResponse<List<ConsultationDto>>> getAdvisorConsultations(
            @AuthenticationPrincipal UserPrincipal principal) {
        if (principal == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("Authentication required"));
        }
        List<Consultation> list = consultationRepository.findAllByOrderByCreatedAtDesc();
        List<ConsultationDto> dtos = list.stream().map(this::toDto).toList();
        return ResponseEntity.ok(ApiResponse.success(dtos));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ConsultationDto>> getById(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String id) {
        return consultationRepository.findById(id)
                .map(c -> ResponseEntity.ok(ApiResponse.success(toDto(c))))
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ConsultationDto>> create(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody CreateConsultationRequest request) {
        if (principal == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("Authentication required"));
        }
        if (request.getTopic() == null || request.getTopic().isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Chủ đề tư vấn không được để trống"));
        }
        if (request.getMessage() == null || request.getMessage().isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Nội dung không được để trống"));
        }

        Consultation.ConsultationMode mode = Consultation.ConsultationMode.CHAT;
        if (request.getMode() != null && !request.getMode().isBlank()) {
            try {
                mode = Consultation.ConsultationMode.valueOf(request.getMode().toUpperCase());
            } catch (IllegalArgumentException ignored) {}
        }

        String targetAdvisorId = request.getAdvisorId();
        if (targetAdvisorId == null || targetAdvisorId.isBlank()) {
            if (request.getUniversityId() != null && !request.getUniversityId().isBlank()) {
                String resolvedUniId = universityRepository.findById(request.getUniversityId())
                        .or(() -> universityRepository.findByCode(request.getUniversityId()))
                        .map(com.admitconsult.entity.University::getId)
                        .orElse(request.getUniversityId());
                var uniAdvisors = advisorRepository.findByUniversityId(resolvedUniId);
                if (!uniAdvisors.isEmpty()) {
                    targetAdvisorId = uniAdvisors.get(0).getId();
                }
            }
            if (targetAdvisorId == null || targetAdvisorId.isBlank()) {
                var allAdvisors = advisorRepository.findAll();
                if (!allAdvisors.isEmpty()) {
                    targetAdvisorId = allAdvisors.get(0).getId();
                }
            }
        }

        Consultation consultation = Consultation.builder()
                .studentId(principal.getId())
                .advisorId(targetAdvisorId)
                .topic(request.getTopic().trim())
                .message(request.getMessage().trim())
                .mode(mode)
                .scheduledTime(request.getScheduledTime())
                .contactPhone(request.getContactPhone())
                .status(Consultation.ConsultationStatus.PENDING)
                .build();

        Consultation saved = consultationRepository.save(consultation);

        // Also record initial message in message table
        ConsultationMessage initialMsg = ConsultationMessage.builder()
                .consultationId(saved.getId())
                .senderId(principal.getId())
                .content(saved.getMessage())
                .isOfficial(false)
                .build();
        consultationMessageRepository.save(initialMsg);

        return ResponseEntity.ok(ApiResponse.success("Yêu cầu tư vấn đã được gửi thành công", toDto(saved)));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<ApiResponse<ConsultationDto>> updateStatus(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String id,
            @RequestBody UpdateStatusRequest request) {
        if (principal == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("Authentication required"));
        }
        Consultation consultation = consultationRepository.findById(id).orElse(null);
        if (consultation == null) {
            return ResponseEntity.notFound().build();
        }

        Consultation.ConsultationStatus newStatus;
        try {
            newStatus = Consultation.ConsultationStatus.valueOf(request.getStatus().toUpperCase());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Trạng thái không hợp lệ"));
        }

        consultation.setStatus(newStatus);

        // If advisor is accepting and consultation didn't have an advisor assigned, bind advisor
        var advisorOpt = advisorRepository.findByUserId(principal.getId());
        if (advisorOpt.isPresent() && consultation.getAdvisorId() == null) {
            consultation.setAdvisorId(advisorOpt.get().getId());
        }

        Consultation saved = consultationRepository.save(consultation);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật trạng thái thành công", toDto(saved)));
    }

    @GetMapping("/{id}/messages")
    public ResponseEntity<ApiResponse<List<ConsultationMessageDto>>> getMessages(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String id) {
        if (principal == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("Authentication required"));
        }
        Consultation consultation = consultationRepository.findById(id).orElse(null);
        if (consultation == null) {
            return ResponseEntity.notFound().build();
        }

        List<ConsultationMessage> messages = consultationMessageRepository
                .findByConsultationIdOrderByCreatedAtAsc(id);
        List<ConsultationMessageDto> dtos = messages.stream().map(this::toMessageDto).toList();
        return ResponseEntity.ok(ApiResponse.success(dtos));
    }

    @PostMapping("/{id}/messages")
    public ResponseEntity<ApiResponse<ConsultationMessageDto>> sendMessage(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String id,
            @RequestBody SendMessageRequest request) {
        if (principal == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("Authentication required"));
        }
        if (request.getContent() == null || request.getContent().isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Nội dung tin nhắn không được để trống"));
        }

        Consultation consultation = consultationRepository.findById(id).orElse(null);
        if (consultation == null) {
            return ResponseEntity.notFound().build();
        }

        boolean isAdvisor = advisorRepository.findByUserId(principal.getId()).isPresent();

        ConsultationMessage msg = ConsultationMessage.builder()
                .consultationId(id)
                .senderId(principal.getId())
                .content(request.getContent().trim())
                .isOfficial(isAdvisor)
                .build();
        ConsultationMessage saved = consultationMessageRepository.save(msg);

        // If consultation was pending and advisor messages, auto-accept it
        if (isAdvisor && consultation.getStatus() == Consultation.ConsultationStatus.PENDING) {
            consultation.setStatus(Consultation.ConsultationStatus.ACCEPTED);
            var advisorOpt = advisorRepository.findByUserId(principal.getId());
            if (advisorOpt.isPresent() && consultation.getAdvisorId() == null) {
                consultation.setAdvisorId(advisorOpt.get().getId());
            }
            consultationRepository.save(consultation);
        }

        return ResponseEntity.ok(ApiResponse.success(toMessageDto(saved)));
    }

    private ConsultationDto toDto(Consultation c) {
        String studentName = null;
        String studentEmail = null;
        if (c.getStudentId() != null) {
            User s = null;
            try {
                s = c.getStudent();
            } catch (Exception ignored) {}
            if (s == null) {
                s = userRepository.findById(c.getStudentId()).orElse(null);
            }
            if (s != null) {
                try {
                    studentName = s.getName();
                    studentEmail = s.getEmail();
                } catch (Exception e) {
                    s = userRepository.findById(c.getStudentId()).orElse(null);
                    if (s != null) {
                        studentName = s.getName();
                        studentEmail = s.getEmail();
                    }
                }
            }
        }

        String advisorName = null;
        if (c.getAdvisorId() != null) {
            com.admitconsult.entity.Advisor adv = null;
            try {
                adv = c.getAdvisor();
            } catch (Exception ignored) {}
            if (adv == null) {
                adv = advisorRepository.findById(c.getAdvisorId()).orElse(null);
            }
            if (adv != null) {
                User u = null;
                try {
                    u = adv.getUser();
                } catch (Exception ignored) {}
                if (u == null && adv.getUserId() != null) {
                    u = userRepository.findById(adv.getUserId()).orElse(null);
                }
                String name = u != null ? u.getName() : null;
                String title = adv.getTitle();
                if (name != null && title != null) {
                    advisorName = title + " (" + name + ")";
                } else if (name != null) {
                    advisorName = name;
                } else {
                    advisorName = title;
                }
            }
        }

        return ConsultationDto.builder()
                .id(c.getId())
                .studentId(c.getStudentId())
                .studentName(studentName)
                .studentEmail(studentEmail)
                .advisorId(c.getAdvisorId())
                .advisorName(advisorName)
                .topic(c.getTopic())
                .message(c.getMessage())
                .mode(c.getMode() != null ? c.getMode().name() : "CHAT")
                .scheduledTime(c.getScheduledTime())
                .contactPhone(c.getContactPhone())
                .status(c.getStatus() != null ? c.getStatus().name() : "PENDING")
                .createdAt(c.getCreatedAt())
                .build();
    }

    private ConsultationMessageDto toMessageDto(ConsultationMessage m) {
        String senderName = null;
        String senderRole = "STUDENT";

        User sender = null;
        try {
            sender = m.getSender();
        } catch (Exception ignored) {}
        if (sender == null && m.getSenderId() != null) {
            sender = userRepository.findById(m.getSenderId()).orElse(null);
        }
        if (sender != null) {
            try {
                senderName = sender.getName();
            } catch (Exception e) {
                sender = userRepository.findById(m.getSenderId()).orElse(null);
                if (sender != null) senderName = sender.getName();
            }
        }

        if (m.getSenderId() != null && advisorRepository.findByUserId(m.getSenderId()).isPresent()) {
            senderRole = "ADVISOR";
        }

        return ConsultationMessageDto.builder()
                .id(m.getId())
                .consultationId(m.getConsultationId())
                .senderId(m.getSenderId())
                .senderName(senderName)
                .senderRole(senderRole)
                .content(m.getContent())
                .isOfficial(m.getIsOfficial())
                .createdAt(m.getCreatedAt())
                .build();
    }

    @lombok.Data
    public static class CreateConsultationRequest {
        private String advisorId;
        private String universityId;
        private String topic;
        private String message;
        private String mode;
        private String scheduledTime;
        private String contactPhone;
    }

    @lombok.Data
    public static class UpdateStatusRequest {
        private String status;
    }

    @lombok.Data
    public static class SendMessageRequest {
        private String content;
    }
}