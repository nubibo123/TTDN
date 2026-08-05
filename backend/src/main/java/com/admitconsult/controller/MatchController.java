package com.admitconsult.controller;

import com.admitconsult.dto.ApiResponse;
import com.admitconsult.dto.MatchRequestDto;
import com.admitconsult.dto.MatchResultDto;
import com.admitconsult.service.MatchService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/match")
@RequiredArgsConstructor
public class MatchController {

    private final MatchService matchService;

    @PostMapping
    public ResponseEntity<ApiResponse<List<MatchResultDto>>> match(@RequestBody MatchRequestDto req) {
        return ResponseEntity.ok(ApiResponse.success(matchService.match(req)));
    }
}
