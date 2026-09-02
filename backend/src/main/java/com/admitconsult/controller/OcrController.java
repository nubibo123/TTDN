package com.admitconsult.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ocr")
@RequiredArgsConstructor
public class OcrController {

    private static final String DEFAULT_INVOKE_URL = "https://integrate.api.nvidia.com/v1/chat/completions";
    private static final String DEFAULT_MODEL = "meta/llama-3.2-90b-vision-instruct";
    private static final String OCR_PROMPT = """
            Hãy đọc hình ảnh học bạ này và trích xuất điểm số.
            Trả về đúng JSON hợp lệ, không markdown, không giải thích:
            {
              "hoc_ky_1": {
                "toan": null, "van": null, "ngoai_ngu": null, "vat_ly": null,
                "hoa_hoc": null, "sinh_hoc": null, "lich_su": null, "dia_ly": null,
                "gd_kt_pl": null, "tin_hoc": null, "cong_nghe": null
              },
              "hoc_ky_2": {
                "toan": null, "van": null, "ngoai_ngu": null, "vat_ly": null,
                "hoa_hoc": null, "sinh_hoc": null, "lich_su": null, "dia_ly": null,
                "gd_kt_pl": null, "tin_hoc": null, "cong_nghe": null
              }
            }
            Chỉ trích xuất các môn: Toán, Ngữ văn, Ngoại ngữ, Lịch sử, Địa lý,
            Vật lý, Hóa học, Sinh học, Giáo dục kinh tế và pháp luật, Tin học, Công nghệ.
            Môn không có trong ảnh phải để null.
            """;

    private final RestClient.Builder restClientBuilder;
    private final ObjectMapper objectMapper;

    @Value("${nvidia.api-key:}")
    private String apiKey;

    @Value("${nvidia.invoke-url:" + DEFAULT_INVOKE_URL + "}")
    private String invokeUrl;

    @Value("${nvidia.model:" + DEFAULT_MODEL + "}")
    private String model;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Map<String, String>> extract(@RequestPart("file") MultipartFile file) throws IOException {
        if (file.isEmpty() || !StringUtils.hasText(file.getContentType())
                || !file.getContentType().startsWith("image/")) {
            return error(HttpStatus.BAD_REQUEST, "File phải là hình ảnh hợp lệ");
        }
        if (!StringUtils.hasText(apiKey)) {
            return error(HttpStatus.SERVICE_UNAVAILABLE, "NVIDIA_API_KEY chưa được cấu hình trên backend");
        }

        String mimeType = file.getContentType();
        String dataUrl = "data:" + mimeType + ";base64,"
                + Base64.getEncoder().encodeToString(file.getBytes());

        Map<String, Object> imageUrl = Map.of("url", dataUrl);
        Map<String, Object> imagePart = Map.of("type", "image_url", "image_url", imageUrl);
        Map<String, Object> textPart = Map.of("type", "text", "text", OCR_PROMPT);
        Map<String, Object> message = Map.of(
                "role", "user",
                "content", List.of(imagePart, textPart)
        );
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("model", model);
        payload.put("messages", List.of(message));
        payload.put("temperature", 0.1);
        payload.put("max_tokens", 1024);
        payload.put("stream", false);

        try {
            String responseBody = restClientBuilder.build()
                    .post()
                    .uri(invokeUrl)
                    .contentType(MediaType.APPLICATION_JSON)
                    .accept(MediaType.APPLICATION_JSON)
                    .header("Authorization", "Bearer " + apiKey)
                    .body(payload)
                    .retrieve()
                    .body(String.class);

            JsonNode response = objectMapper.readTree(responseBody);
            String content = response.path("choices").path(0).path("message").path("content").asText(null);
            if (!StringUtils.hasText(content)) {
                return error(HttpStatus.BAD_GATEWAY, "NVIDIA NIM không trả về nội dung OCR");
            }
            return ResponseEntity.ok(Map.of("text", content));
        } catch (RestClientResponseException exception) {
            return error(HttpStatus.valueOf(exception.getStatusCode().value()),
                    "NVIDIA NIM lỗi: " + exception.getResponseBodyAsString());
        } catch (Exception exception) {
            return error(HttpStatus.BAD_GATEWAY, "Không thể kết nối NVIDIA NIM");
        }
    }

    private ResponseEntity<Map<String, String>> error(HttpStatus status, String message) {
        return ResponseEntity.status(status).body(Map.of("error", message));
    }
}
