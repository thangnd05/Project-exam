package com.project_exam.backend.modules.vocabulary.service;

import com.project_exam.backend.modules.assessment.exam.domain.Answer;
import com.project_exam.backend.modules.assessment.exam.domain.Passage;
import com.project_exam.backend.modules.assessment.exam.domain.Question;
import com.project_exam.backend.shared.exception.BadRequestException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.*;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class GeminiService {

    private static final Logger logger = LoggerFactory.getLogger(GeminiService.class);

    private static final int CONNECT_TIMEOUT_MS = 10_000;
    private static final int READ_TIMEOUT_MS = 30_000;

    private static final double EXPLAIN_TEMPERATURE = 0.5;
    private static final int EXPLAIN_MAX_TOKENS = 1024;
    private static final double VOCAB_TEMPERATURE = 0.2;
    private static final int VOCAB_MAX_TOKENS = 2048;

    @Value("${gemini.api.key}")
    private String geminiApiKey;

    @Value("${gemini.api.url}")
    private String geminiApiUrl;

    private final RestTemplate restTemplate;

    public GeminiService() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(CONNECT_TIMEOUT_MS);
        factory.setReadTimeout(READ_TIMEOUT_MS);
        this.restTemplate = new RestTemplate(factory);
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
        StringBuilder prompt = new StringBuilder(1024);
        prompt.append("Bạn là một trợ lý chuyên giải thích các câu hỏi trắc nghiệm tiếng Anh. Hãy trả lời bằng định dạng HTML.\n");
        prompt.append("Yêu cầu:\n");
        prompt.append("1. Phân tích câu hỏi và từng đáp án dựa trên ngữ cảnh được cung cấp (nếu có).\n");
        prompt.append("2. Sử dụng thẻ <strong> để in đậm các tiêu đề (ví dụ: 'Phân tích câu hỏi:', 'Đáp án đúng:', 'A:', 'B:', ...).\n");
        prompt.append("3. CHỈ in đậm TOÀN BỘ phần giải thích của đáp án ĐÚNG. Các đáp án sai KHÔNG được in đậm bất kỳ từ nào trong phần giải thích.\n");
        prompt.append("4. Trả lời theo đúng cấu trúc HTML template sau đây:\n\n");

        prompt.append("<div>\n")
              .append("  <p><strong>Phân tích câu hỏi:</strong> [Giải thích ngắn gọn về mục tiêu của câu hỏi dựa trên ngữ cảnh]</p>\n")
              .append("  <p><strong>Đáp án đúng:</strong> [Chỉ ghi ký tự của đáp án đúng]</p>\n")
              .append("  <strong>Giải thích chi tiết:</strong>\n")
              .append("  <ul>\n")
              .append("    <li><strong>A:</strong> [Giải thích tại sao A đúng hoặc sai. Nếu đúng, toàn bộ giải thích này phải được bọc trong thẻ <strong>]</li>\n")
              .append("    <li><strong>B:</strong> [Giải thích tại sao B đúng hoặc sai]</li>\n")
              .append("    <li><strong>C:</strong> [Giải thích tại sao C đúng hoặc sai]</li>\n")
              .append("    <li><strong>D:</strong> [Giải thích tại sao D đúng hoặc sai]</li>\n")
              .append("  </ul>\n")
              .append("</div>\n");

        prompt.append("----------------\n");

        if (passage != null) {
            String content = passage.getContent();
            String mediaUrl = passage.getMediaUrl();
            if (content != null && !content.isBlank()) {
                prompt.append("DỮ LIỆU NGỮ CẢNH (ĐOẠN VĂN):\n").append(content).append("\n\n");
            } else if (mediaUrl != null && !mediaUrl.isBlank()) {
                prompt.append("DỮ LIỆU NGỮ CẢNH: Đây là một câu hỏi dựa trên một bài nghe.\n\n");
            }
        }

        prompt.append("DỮ LIỆU CÂU HỎI:\n");
        prompt.append("Câu hỏi: ").append(question.getQuestionText()).append("\n");

        for (Answer a : answers) {
            prompt.append("- ")
                  .append(a.getAnswerLabel())
                  .append(": ")
                  .append(a.getAnswerText());
            if (Boolean.TRUE.equals(a.getIsCorrect())) {
                prompt.append(" (Đây là đáp án đúng)");
            }
            prompt.append("\n");
        }

        return prompt.toString();
    }

    private String buildVocabularyPrompt(String rawText) {
        return "Bạn là trợ lý giúp chuẩn hóa dữ liệu từ vựng tiếng Anh.\n" +
               "Dưới đây là dữ liệu thô người dùng nhập vào. Hãy chuyển nó thành một mảng JSON có cấu trúc chính xác như sau:\n" +
               "[\n" +
               "  {\n" +
               "    \"word\": \"từ tiếng Anh\",\n" +
               "    \"meaning\": \"nghĩa tiếng Việt\",\n" +
               "    \"example\": \"câu ví dụ tiếng Anh (nếu có, không thì để trống)\"\n" +
               "  }\n" +
               "]\n" +
               "Yêu cầu:\n" +
               "1. CHỈ trả về duy nhất chuỗi JSON, không có text giải thích gì thêm, không bọc trong markdown code blocks.\n" +
               "2. Nếu dữ liệu không rõ ràng, hãy cố gắng suy luận từ vựng và nghĩa chính xác nhất.\n" +
               "3. Nếu người dùng nhập dạng 'word - meaning' hoặc 'word: meaning' hoặc chỉ là một danh sách từ, hãy xử lý hết.\n" +
               "\nDATA:\n" +
               rawText;
    }

    // ---------- API CALL ----------

    private String callGeminiApi(String prompt, double temperature, int maxTokens) {
        Map<String, Object> requestBody = buildRequestBody(prompt, temperature, maxTokens);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("x-goog-api-key", geminiApiKey);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        try {
            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                    geminiApiUrl,
                    HttpMethod.POST,
                    entity,
                    new ParameterizedTypeReference<Map<String, Object>>() {}
            );
            return extractText(response.getBody());

        } catch (HttpStatusCodeException e) {
            logger.error("Gemini API trả về lỗi {}: {}", e.getStatusCode(), e.getResponseBodyAsString());
            if (e.getStatusCode().is4xxClientError()) {
                throw new BadRequestException("Gemini API từ chối yêu cầu (kiểm tra API key/quota): " + e.getStatusCode());
            }
            throw new BadRequestException("Gemini API gặp sự cố máy chủ: " + e.getStatusCode());
        } catch (ResourceAccessException e) {
            logger.error("Không thể kết nối đến Gemini API: {}", e.getMessage());
            throw new BadRequestException("Không thể kết nối đến Gemini API. Vui lòng kiểm tra kết nối mạng.");
        } catch (RestClientException e) {
            logger.error("Lỗi không xác định khi gọi Gemini: {}", e.getMessage());
            throw new BadRequestException("Lỗi khi gọi Gemini API: " + e.getMessage());
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