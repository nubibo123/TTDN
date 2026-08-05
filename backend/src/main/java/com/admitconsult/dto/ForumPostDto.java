package com.admitconsult.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ForumPostDto {
    private String id;
    private String threadId;
    private String authorId;
    private String authorName;
    private String parentId;
    private String content;
    private Integer likesCount;
    private Boolean isOfficialReply;
    private LocalDateTime createdAt;
}