package com.admitconsult.service;

import com.admitconsult.entity.University;
import com.admitconsult.entity.User;
import com.admitconsult.repository.UniversityRepository;
import com.admitconsult.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UniversityService {
    private final UniversityRepository universityRepository;

    public List<University> getAllUniversity() {
        return universityRepository.findAll();
    }

    public University getUniversityById(String id) {
        return universityRepository.findById(id).orElseThrow(() -> new RuntimeException("No University found with id: " + id));
    }

    public University createUniversity(University university) {
        if (universityRepository.findByCode(university.getCode()).isPresent()) {
            throw new RuntimeException("University with code " + university.getCode() + " already exists");
        }

        return universityRepository.save(university);
    }

    public University updateUniversity(String id, University university) {
        University existingUniversity = getUniversityById(id);

        if (!existingUniversity.getCode().equals(university.getCode()) && universityRepository.findByCode(university.getCode()).isPresent()) {
            throw new RuntimeException("University with code " + university.getCode() + " already exists with another code");
        }

        existingUniversity.setCode(university.getCode());
        existingUniversity.setName(university.getName());
        existingUniversity.setRegion(university.getRegion());
        existingUniversity.setType(university.getType());
        existingUniversity.setAddress(university.getAddress());
        existingUniversity.setWebsiteUrl(university.getWebsiteUrl());
        existingUniversity.setTuitionRange(university.getTuitionRange());
        existingUniversity.setIsVerified(university.getIsVerified());
        existingUniversity.setDeanUrl(university.getDeanUrl());
        existingUniversity.setLatitude(university.getLatitude());
        existingUniversity.setLongitude(university.getLongitude());

        return universityRepository.save(existingUniversity);
    }

    public void deleteUniversity(String id) {
        University university = getUniversityById(id);
        universityRepository.delete(university);
    }
}
