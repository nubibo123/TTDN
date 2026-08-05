package com.admitconsult.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "student_profiles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudentProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(name = "user_id", nullable = false, unique = true)
    private String userId;

    @Column(name = "graduation_year")
    private Integer graduationYear;

    private String province;

    @Column(name = "is_profile_public")
    @Builder.Default
    private Boolean isProfilePublic = false;

    @Column(name = "show_grades")
    @Builder.Default
    private Boolean showGrades = false;

    @Column(name = "allow_contact")
    @Builder.Default
    private Boolean allowContact = true;

    @Column(name = "show_in_forum")
    @Builder.Default
    private Boolean showInForum = true;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", insertable = false, updatable = false)
    private User user;
}