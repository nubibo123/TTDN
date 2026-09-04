package com.admitconsult.runner;

import com.admitconsult.entity.*;
import com.admitconsult.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class ConsultationSeedRunner implements ApplicationRunner {

    private final UserRepository userRepository;
    private final UserRoleRecordRepository userRoleRecordRepository;
    private final AdvisorRepository advisorRepository;
    private final UniversityRepository universityRepository;
    private final ConsultationRepository consultationRepository;
    private final ConsultationMessageRepository consultationMessageRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(ApplicationArguments args) {
        if (consultationRepository.count() > 0) {
            log.info("Consultation data already exists. Skipping seed.");
            return;
        }

        log.info("Seeding initial student consultation requests...");

        // 1. Get or create a sample student user
        User student = userRepository.findByEmail("student.demo@gmail.com").orElseGet(() -> {
            User u = User.builder()
                    .email("student.demo@gmail.com")
                    .passwordHash(passwordEncoder.encode("123456"))
                    .name("Nguyễn Văn Hùng")
                    .isActive(true)
                    .build();
            User saved = userRepository.save(u);
            userRoleRecordRepository.save(UserRoleRecord.builder()
                    .userId(saved.getId())
                    .role(UserRoleRecord.UserRole.STUDENT)
                    .isVerified(true)
                    .build());
            return saved;
        });

        // 2. Get or create a sample advisor user
        User advisorUser = userRepository.findByEmail("advisor.neu@admitconsult.com").orElseGet(() -> {
            User u = User.builder()
                    .email("advisor.neu@admitconsult.com")
                    .passwordHash(passwordEncoder.encode("123456"))
                    .name("TS. Nguyễn Văn A")
                    .isActive(true)
                    .build();
            User saved = userRepository.save(u);
            userRoleRecordRepository.save(UserRoleRecord.builder()
                    .userId(saved.getId())
                    .role(UserRoleRecord.UserRole.ADVISOR)
                    .isVerified(true)
                    .build());
            return saved;
        });

        // Find a university (e.g., NEU or first available)
        University university = universityRepository.findByCode("NEU")
                .orElseGet(() -> {
                    List<University> all = universityRepository.findAll();
                    return all.isEmpty() ? null : all.get(0);
                });

        String uniId = university != null ? university.getId() : null;

        Advisor advisor = advisorRepository.findByUserId(advisorUser.getId()).orElseGet(() -> {
            Advisor a = Advisor.builder()
                    .userId(advisorUser.getId())
                    .universityId(uniId)
                    .title("Tư vấn viên chính thức")
                    .bio("Chuyên gia tư vấn chọn ngành, tư vấn định hướng tuyển sinh đại học.")
                    .build();
            return advisorRepository.save(a);
        });

        // 3. Seed consultations
        Consultation c1 = Consultation.builder()
                .studentId(student.getId())
                .advisorId(advisor.getId())
                .topic("Tư vấn khả năng trúng tuyển ngành Khoa học máy tính & CNTT")
                .message("Chào thầy/cô, em đạt 27.5 điểm khối A00 (Toán: 9.2, Lý: 9.0, Hóa: 9.3). Em muốn tư vấn khả năng đỗ ngành CNTT và các suất học bổng dành cho tân sinh viên.")
                .mode(Consultation.ConsultationMode.CHAT)
                .status(Consultation.ConsultationStatus.PENDING)
                .build();
        Consultation savedC1 = consultationRepository.save(c1);

        consultationMessageRepository.save(ConsultationMessage.builder()
                .consultationId(savedC1.getId())
                .senderId(student.getId())
                .content(savedC1.getMessage())
                .isOfficial(false)
                .build());

        Consultation c2 = Consultation.builder()
                .studentId(student.getId())
                .advisorId(advisor.getId())
                .topic("Hỏi về phương thức xét tuyển học bạ & chứng chỉ IELTS")
                .message("Dạ thưa tư vấn viên, em có chứng chỉ IELTS 7.5 và điểm học bạ trung bình 9.1. Cho em hỏi quy trình nộp hồ sơ xét tuyển thẳng của trường ra sao ạ?")
                .mode(Consultation.ConsultationMode.SCHEDULED_CALL)
                .scheduledTime("Chiều (14h00 - 17h00)")
                .contactPhone("0988 123 456")
                .status(Consultation.ConsultationStatus.PENDING)
                .build();
        Consultation savedC2 = consultationRepository.save(c2);

        consultationMessageRepository.save(ConsultationMessage.builder()
                .consultationId(savedC2.getId())
                .senderId(student.getId())
                .content(savedC2.getMessage())
                .isOfficial(false)
                .build());

        Consultation c3 = Consultation.builder()
                .studentId(student.getId())
                .advisorId(advisor.getId())
                .topic("Tư vấn chọn ngành Marketing & Truyền thông")
                .message("Em muốn trao đổi về chương trình đào tạo chất lượng cao ngành Marketing và cơ hội việc làm sau khi tốt nghiệp.")
                .mode(Consultation.ConsultationMode.CHAT)
                .status(Consultation.ConsultationStatus.ACCEPTED)
                .build();
        Consultation savedC3 = consultationRepository.save(c3);

        consultationMessageRepository.save(ConsultationMessage.builder()
                .consultationId(savedC3.getId())
                .senderId(student.getId())
                .content(savedC3.getMessage())
                .isOfficial(false)
                .build());

        consultationMessageRepository.save(ConsultationMessage.builder()
                .consultationId(savedC3.getId())
                .senderId(advisorUser.getId())
                .content("Chào em! Cảm ơn em đã quan tâm. Ngành Marketing của trường có 2 định hướng: Marketing số và Quản trị Thương hiệu. Em đang thiên về định hướng nào?")
                .isOfficial(true)
                .build());

        log.info("Consultation seed completed successfully! Created 3 initial student requests.");
    }
}
