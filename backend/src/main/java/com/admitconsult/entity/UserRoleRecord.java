package com.admitconsult.entity;

import jakarta.persistence.*;
import lombok.*;

import java.io.Serializable;

@Entity
@Table(name = "user_roles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@IdClass(UserRoleRecord.UserRoleRecordId.class)
public class UserRoleRecord {

    @Id
    @Column(name = "user_id")
    private String userId;

    @Id
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserRole role;

    @Column(name = "university_id")
    private String universityId;

    @Column(name = "is_verified")
    @Builder.Default
    private Boolean isVerified = false;

    private String bio;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", insertable = false, updatable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "university_id", insertable = false, updatable = false)
    private University university;

    public enum UserRole { STUDENT, ADVISOR, ADMIN }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserRoleRecordId implements Serializable {
        private String userId;
        private UserRole role;
    }
}