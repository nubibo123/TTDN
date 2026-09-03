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
public class ConsultationDto {
    private String id;
    private String studentId;
    private String studentName;
    private String studentEmail;
    private String advisorId;
    private String advisorName;
    private String topic;
    private String message;
    private String mode;
    private String scheduledTime;
    private String contactPhone;
    private String status;
    private LocalDateTime createdAt;
}
