package com.project_exam.backend.shared.util;

import java.security.SecureRandom;
import org.springframework.stereotype.Component;

@Component
public class OtpUtil {

    private static final SecureRandom RANDOM = new SecureRandom();

    public String generateOtp() {
        int randomNumber = RANDOM.nextInt(999999);
        String output = Integer.toString(randomNumber);

        while (output.length() < 6) {
            output = "0" + output;
        }
        return output;
    }
}
