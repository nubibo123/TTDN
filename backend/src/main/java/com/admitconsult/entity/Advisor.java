package com.admitconsult.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "advisors")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Advisor {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(name = "user_id", nullable = false, unique = true)
    private String userId;

    @Column(name = "university_id", nullable = false)
    private String universityId;

    @Column(nullable = false)
    private String title;

    private String bio;

    @OneToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", insertable = false, updatable = false)
    private User user;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "university_id", insertable = false, updatable = false)
    private University university;
}