package com.admitconsult.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ConsultationDto {
    private String id;
    private String studentId;
    private String studentName;
    private String advisorId;
    private String advisorName;
    private String topic;
    private String message;
    private String status;
    private LocalDateTime createdAt;
}

