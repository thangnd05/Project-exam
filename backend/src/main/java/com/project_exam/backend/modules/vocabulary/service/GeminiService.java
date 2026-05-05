package com.project_exam.backend.modules.vocabulary.service;

import com.project_exam.backend.modules.assessment.exam.domain.Answer;
import com.project_exam.backend.modules.assessment.exam.domain.Passage;
import com.project_exam.backend.modules.assessment.exam.domain.Question;
import com.project_exam.backend.shared.exception.BadRequestException;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.core.io.Resource;
import org.springframework.http.*;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.EnumSet;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
public class GeminiService {

    private static final Logger logger = LoggerFactory.getLogger(GeminiService.class);

    private static final int CONNECT_TIMEOUT_MS = 10_000;
    private static final int READ_TIMEOUT_MS = 30_000;

    private static final double EXPLAIN_TEMPERATURE = 0.5;
    private static final int EXPLAIN_MAX_TOKENS = 1024;
    private static final double VOCAB_TEMPERATURE = 0.2;
    private static final int VOCAB_MAX_TOKENS = 2048;

    private static final int MAX_RETRIES = 3;
    private static final long INITIAL_BACKOFF_MS = 1_000L;
    private static final Set<HttpStatus> RETRYABLE_STATUSES = EnumSet.of(
            HttpStatus.TOO_MANY_REQUESTS,
            HttpStatus.INTERNAL_SERVER_ERROR,
            HttpStatus.BAD_GATEWAY,
            HttpStatus.SERVICE_UNAVAILABLE,
            HttpStatus.GATEWAY_TIMEOUT
    );

    @Value("${gemini.api.key}")
    private String geminiApiKey;

    @Value("${gemini.api.url}")
    private String geminiApiUrl;

    @Value("classpath:prompts/vocabulary-standardize.md")
    private Resource vocabularyPromptResource;

    @Value("classpath:prompts/question-explain.md")
    private Resource questionExplainPromptResource;

    private String vocabularyPromptTemplate;
    private String questionExplainPromptTemplate;

    private final RestTemplate restTemplate;

    public GeminiService() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(CONNECT_TIMEOUT_MS);
        factory.setReadTimeout(READ_TIMEOUT_MS);
        this.restTemplate = new RestTemplate(factory);
    }

    @PostConstruct
    void loadPromptTemplates() {
        try {
            vocabularyPromptTemplate = vocabularyPromptResource.getContentAsString(StandardCharsets.UTF_8);
            questionExplainPromptTemplate = questionExplainPromptResource.getContentAsString(StandardCharsets.UTF_8);
        } catch (IOException e) {
            throw new IllegalStateException("Không thể load prompt template từ classpath: " + e.getMessage(), e);
        }
    }

    /**
     * Gọi Gemini API để giải thích câu hỏi trắc nghiệm.
     * @param passage có thể null nếu câu hỏi không có ngữ cảnh.
     */
    public String explainQuestion(Question question, List<Answer> answers, Passage passage) {
        if (question == null) {
            throw new BadRequestException("Câu hỏi không được để trống.");
        }
        if (answers == null || answers.isEmpty()) {
            throw new BadRequestException("Danh sách đáp án không được để trống.");
        }

        logger.info("Gọi Gemini API để giải thích câu hỏi ID: {}", question.getQuestionId());

        String prompt = buildExplainPrompt(question, answers, passage);
        return callGeminiApi(prompt, EXPLAIN_TEMPERATURE, EXPLAIN_MAX_TOKENS);
    }

    public String standardizeVocabulary(String rawText) {
        if (rawText == null || rawText.isBlank()) {
            throw new BadRequestException("Dữ liệu từ vựng không được để trống.");
        }

        logger.info("Gọi Gemini API để chuẩn hóa từ vựng (độ dài input: {} ký tự).", rawText.length());

        String prompt = buildVocabularyPrompt(rawText);
        return callGeminiApi(prompt, VOCAB_TEMPERATURE, VOCAB_MAX_TOKENS);
    }

    // ---------- PROMPT BUILDERS ----------

    private String buildExplainPrompt(Question question, List<Answer> answers, Passage passage) {
        StringBuilder userData = new StringBuilder(512);

        if (passage != null) {
            String content = passage.getContent();
            String mediaUrl = passage.getMediaUrl();
            if (content != null && !content.isBlank()) {
                userData.append("DỮ LIỆU NGỮ CẢNH (ĐOẠN VĂN):\n").append(content).append("\n\n");
            } else if (mediaUrl != null && !mediaUrl.isBlank()) {
                userData.append("DỮ LIỆU NGỮ CẢNH: Đây là một câu hỏi dựa trên một bài nghe.\n\n");
            }
        }

        userData.append("DỮ LIỆU CÂU HỎI:\n");
        userData.append("Câu hỏi: ").append(question.getQuestionText()).append("\n");

        for (Answer a : answers) {
            userData.append("- ")
                    .append(a.getAnswerLabel())
                    .append(": ")
                    .append(a.getAnswerText());
            if (Boolean.TRUE.equals(a.getIsCorrect())) {
                userData.append(" (Đây là đáp án đúng)");
            }
            userData.append("\n");
        }

        return questionExplainPromptTemplate.replace("{{userData}}", userData.toString());
    }

    private String buildVocabularyPrompt(String rawText) {
        return vocabularyPromptTemplate.replace("{{rawText}}", rawText);
    }

    // ---------- API CALL ----------

    private String callGeminiApi(String prompt, double temperature, int maxTokens) {
        Map<String, Object> requestBody = buildRequestBody(prompt, temperature, maxTokens);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("x-goog-api-key", geminiApiKey);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        long backoff = INITIAL_BACKOFF_MS;
        for (int attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            try {
                ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                        geminiApiUrl,
                        HttpMethod.POST,
                        entity,
                        new ParameterizedTypeReference<Map<String, Object>>() {}
                );
                return extractText(response.getBody());

            } catch (HttpStatusCodeException e) {
                HttpStatusCode status = e.getStatusCode();
                logger.error("Gemini API trả về lỗi {} (lần thử {}/{}): {}",
                        status, attempt, MAX_RETRIES, e.getResponseBodyAsString());

                if (status.is4xxClientError() && status.value() != HttpStatus.TOO_MANY_REQUESTS.value()) {
                    throw new BadRequestException("Gemini API từ chối yêu cầu (kiểm tra API key/quota): " + status);
                }
                if (!isRetryable(status) || attempt == MAX_RETRIES) {
                    throw new BadRequestException("Gemini API gặp sự cố máy chủ: " + status);
                }
                sleepBackoff(backoff, attempt);
                backoff *= 2;

            } catch (ResourceAccessException e) {
                logger.error("Không thể kết nối đến Gemini API (lần thử {}/{}): {}",
                        attempt, MAX_RETRIES, e.getMessage());
                if (attempt == MAX_RETRIES) {
                    throw new BadRequestException("Không thể kết nối đến Gemini API. Vui lòng kiểm tra kết nối mạng.");
                }
                sleepBackoff(backoff, attempt);
                backoff *= 2;

            } catch (RestClientException e) {
                logger.error("Lỗi không xác định khi gọi Gemini: {}", e.getMessage());
                throw new BadRequestException("Lỗi khi gọi Gemini API: " + e.getMessage());
            }
        }
        throw new BadRequestException("Gemini API không phản hồi sau " + MAX_RETRIES + " lần thử.");
    }

    private boolean isRetryable(HttpStatusCode status) {
        return RETRYABLE_STATUSES.stream().anyMatch(s -> s.value() == status.value());
    }

    private void sleepBackoff(long backoffMs, int attempt) {
        try {
            logger.warn("Chờ {} ms trước khi thử lại Gemini API (attempt {}).", backoffMs, attempt);
            Thread.sleep(backoffMs);
        } catch (InterruptedException ie) {
            Thread.currentThread().interrupt();
            throw new BadRequestException("Bị gián đoạn khi chờ retry Gemini API.");
        }
    }

    private Map<String, Object> buildRequestBody(String prompt, double temperature, int maxTokens) {
        Map<String, Object> part = Map.of("text", prompt);
        Map<String, Object> content = Map.of("parts", List.of(part));
        Map<String, Object> generationConfig = Map.of(
                "temperature", temperature,
                "maxOutputTokens", maxTokens
        );

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("contents", List.of(content));
        requestBody.put("generationConfig", generationConfig);
        return requestBody;
    }

    @SuppressWarnings("unchecked")
    private String extractText(Map<String, Object> body) {
        if (body == null) {
            throw new BadRequestException("Gemini trả về phản hồi rỗng.");
        }

        // Xử lý trường hợp prompt bị chặn bởi safety filter
        Map<String, Object> promptFeedback = (Map<String, Object>) body.get("promptFeedback");
        if (promptFeedback != null && promptFeedback.get("blockReason") != null) {
            String reason = String.valueOf(promptFeedback.get("blockReason"));
            logger.warn("Gemini chặn prompt với lý do: {}", reason);
            throw new BadRequestException("Yêu cầu bị Gemini chặn: " + reason);
        }

        List<Map<String, Object>> candidates = (List<Map<String, Object>>) body.get("candidates");
        if (candidates == null || candidates.isEmpty()) {
            throw new BadRequestException("Gemini không trả về kết quả.");
        }

        Map<String, Object> firstCandidate = candidates.get(0);
        Object finishReason = firstCandidate.get("finishReason");
        if (finishReason != null && !"STOP".equals(finishReason) && !"MAX_TOKENS".equals(finishReason)) {
            logger.warn("Gemini kết thúc bất thường với finishReason: {}", finishReason);
        }

        Map<String, Object> contentWrapper = (Map<String, Object>) firstCandidate.get("content");
        if (contentWrapper == null) {
            throw new BadRequestException("Gemini trả về nội dung rỗng (có thể đã bị bộ lọc an toàn chặn).");
        }

        List<Map<String, Object>> parts = (List<Map<String, Object>>) contentWrapper.get("parts");
        if (parts == null || parts.isEmpty()) {
            throw new BadRequestException("Gemini trả về phản hồi không hợp lệ.");
        }

        Object text = parts.get(0).get("text");
        if (text == null) {
            throw new BadRequestException("Gemini không trả về văn bản.");
        }
        return text.toString();
    }
}