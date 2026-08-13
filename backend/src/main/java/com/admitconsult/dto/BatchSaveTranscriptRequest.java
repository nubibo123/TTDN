package com.admitconsult.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BatchSaveTranscriptRequest {

    @NotEmpty(message = "Transcripts list cannot be empty")
    @Valid
    private List<SaveTranscriptRequest> transcripts;
}
