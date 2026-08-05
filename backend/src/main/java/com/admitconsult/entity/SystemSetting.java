package com.admitconsult.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "system_settings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SystemSetting {

    @Id
    private String key;

    @Column(nullable = false, columnDefinition = "jsonb")
    private String value;
}