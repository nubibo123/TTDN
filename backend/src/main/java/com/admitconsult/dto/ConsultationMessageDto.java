package com.admitconsult.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ConsultationMessageDto {
    private String id;
    private String consultationId;
    private String senderId;
    private String senderName;
    private String senderRole;
    private String content;
    private Boolean isOfficial;
    private LocalDateTime createdAt;
}
