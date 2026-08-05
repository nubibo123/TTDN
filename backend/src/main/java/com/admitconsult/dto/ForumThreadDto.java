package com.admitconsult.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ForumThreadDto {
    private String id;
    private String authorId;
    private String authorName;
    private String categoryId;
    private String categoryName;
    private String title;
    private String content;
    private Integer viewsCount;
    private Boolean isPinned;
    private Boolean isLocked;
    private LocalDateTime createdAt;
    private Integer replyCount;
}