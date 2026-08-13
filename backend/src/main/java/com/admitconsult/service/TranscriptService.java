package com.admitconsult.service;

import com.admitconsult.dto.BatchSaveTranscriptRequest;
import com.admitconsult.dto.SaveTranscriptRequest;
import com.admitconsult.dto.TranscriptDto;
import com.admitconsult.entity.Transcript;
import com.admitconsult.repository.TranscriptRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class TranscriptService {

    private final TranscriptRepository transcriptRepository;

    @Transactional(readOnly = true)
    public List<TranscriptDto> getMyTranscripts(String studentId) {
        return transcriptRepository.findByStudentIdOrderByYearAsc(studentId)
                .stream()
                .map(TranscriptDto::fromEntity)
                .toList();
    }

    @Transactional
    public TranscriptDto saveTranscript(String studentId, SaveTranscriptRequest request) {
        Optional<Transcript> existingOpt = transcriptRepository.findByStudentIdAndSemesterAndYear(
                studentId,
                request.getSemester(),
                request.getYear()
        );

        Transcript transcript;
        if (existingOpt.isPresent()) {
            transcript = existingOpt.get();
            transcript.setScores(request.getScores());
            transcript.setAvgScore(request.getAvgScore());
            transcript.setIsDraft(request.getIsDraft() != null ? request.getIsDraft() : false);
            if (request.getImageUrl() != null) {
                transcript.setImageUrl(request.getImageUrl());
            }
            if (request.getOcrText() != null) {
                transcript.setOcrText(request.getOcrText());
            }
        } else {
            transcript = Transcript.builder()
                    .studentId(studentId)
                    .semester(request.getSemester())
                    .year(request.getYear())
                    .scores(request.getScores())
                    .avgScore(request.getAvgScore())
                    .isDraft(request.getIsDraft() != null ? request.getIsDraft() : false)
                    .imageUrl(request.getImageUrl())
                    .ocrText(request.getOcrText())
                    .build();
        }

        Transcript saved = transcriptRepository.save(transcript);
        log.info("Saved transcript id={} for studentId={}, semester={}, year={}",
                saved.getId(), studentId, saved.getSemester(), saved.getYear());
        return TranscriptDto.fromEntity(saved);
    }

    @Transactional
    public List<TranscriptDto> saveBatchTranscripts(String studentId, BatchSaveTranscriptRequest batchRequest) {
        List<TranscriptDto> results = new ArrayList<>();
        if (batchRequest == null || batchRequest.getTranscripts() == null) {
            return results;
        }

        for (SaveTranscriptRequest req : batchRequest.getTranscripts()) {
            results.add(saveTranscript(studentId, req));
        }

        return results;
    }

    @Transactional
    public boolean deleteTranscript(String studentId, String transcriptId) {
        Optional<Transcript> transcriptOpt = transcriptRepository.findByIdAndStudentId(transcriptId, studentId);
        if (transcriptOpt.isPresent()) {
            transcriptRepository.delete(transcriptOpt.get());
            log.info("Deleted transcript id={} for studentId={}", transcriptId, studentId);
            return true;
        }
        return false;
    }
}
