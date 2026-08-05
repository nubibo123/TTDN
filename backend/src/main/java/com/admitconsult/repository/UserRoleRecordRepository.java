package com.admitconsult.repository;

import com.admitconsult.entity.UserRoleRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserRoleRecordRepository extends JpaRepository<UserRoleRecord, UserRoleRecord.UserRoleRecordId> {
    List<UserRoleRecord> findByUserId(String userId);
    List<UserRoleRecord> findByUniversityId(String universityId);
}