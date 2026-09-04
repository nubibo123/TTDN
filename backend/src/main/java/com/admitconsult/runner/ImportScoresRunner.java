package com.admitconsult.runner;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

/**
 * Placeholder for the legacy CSV score importer.
 *
 * Port logic from the deleted TS script (scripts/import-scores.ts):
 *   - Parse CSV (columns: school_name, school_code, school_id, year, method,
 *                major_name, major_code, subject_group, score, note, url)
 *   - Normalize method via normalizeMethod() (see Known Gotchas in AGENTS.md)
 *   - Upsert University by code, Major by [universityId, code],
 *     AdmissionScore by [majorId, year, method]
 *
 * Implementation hints:
 *   - Read the CSV with java.io.BufferedReader + String.split(",")
 *     (or add commons-csv dependency to pom.xml for robust parsing)
 *   - File path: set via command line arg or environment variable.
 *     The legacy TS script had a hardcoded OneDrive path — do NOT replicate that.
 *   - Tag with @Profile("import") so it only runs on demand:
 *         mvn spring-boot:run -Dspring-boot.run.profiles=import
 */
@Component
@Profile("import")
public class ImportScoresRunner implements CommandLineRunner {

    @Override
    public void run(String... args) {
        if (args.length == 0) {
            System.out.println("[ImportScoresRunner] No CSV path provided. Skipping. " +
                    "Usage: spring-boot:run -Dspring-boot.run.profiles=import -- /path/to/diemchuan.csv");
            return;
        }
        String csvPath = args[0];
        System.out.println("[ImportScoresRunner] Importing from: " + csvPath);
        // TODO: implement CSV parse + upsert loop
    }

    static String normalizeMethod(String m) {
        String s = m == null ? "" : m.trim();
        if (s.matches("(?i).*điểm thi thpt.*")) return "Điểm thi THPT";
        if (s.matches("(?i).*xét học bạ.*"))    return "Xét học bạ";
        if (s.matches("(?i).*đánh giá năng lực.*")) return "Đánh giá năng lực";
        return s;
    }
}
