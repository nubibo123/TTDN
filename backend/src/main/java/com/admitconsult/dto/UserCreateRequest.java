package com.admitconsult.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * Request body for an admin creating/editing a user (e.g. an ADVISOR account).
 * <p>
 * `role` maps to {@link com.admitconsult.entity.UserRoleRecord.UserRole}
 * (ADVISOR is the default when omitted / when used by the advisor flow).
 */
@Data
public class UserCreateRequest {
    @NotBlank
    private String name;

    @Email
    @NotBlank
    private String email;

    @NotBlank
    @Size(min = 6)
    private String password;

    /** Role to assign. Defaults to ADVISOR when null. */
    private String role;

    /** University id the advisor belongs to (required for ADVISOR role). */
    private String universityId;

    /** Advisor title / bio (used when creating an Advisor profile). */
    private String title;
    private String bio;
    private Boolean isActive = true;
}
