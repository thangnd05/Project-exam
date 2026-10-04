package com.project_exam.backend.modules.assessment.exam.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import lombok.Data;

import java.util.List;

/**
 * Payload của chức năng import câu hỏi từ file JSON.
 * Tên trường trùng với output của /preview/document nên có thể export preview ra JSON,
 * sửa tay rồi import lại nguyên dạng.
 */
@Data
public class QuestionJsonImportRequest {

    private Integer version;

    private String examPartId;
    private String classId;
    private String chapterId;

    /** EXAM | PRACTICE. Bỏ trống mặc định EXAM. */
    private String usageScope;

    /** Câu hỏi độc lập (không có đoạn văn / audio). */
    private List<JsonQuestion> questions;

    /** Nhóm câu hỏi theo đoạn văn / bài nghe. */
    private List<JsonGroup> groups;

    @Data
    public static class JsonGroup {
        /** Tên hoặc id phần thi, chỉ dùng khi tạo đề từ JSON. Bỏ trống sẽ lấy từ câu hỏi trong nhóm. */
        @JsonAlias("part")
        private String examPart;

        private JsonPassage passage;
        private List<JsonQuestion> questions;
    }

    @Data
    public static class JsonPassage {
        private String content;
        private String contentTranslation;
        private String mediaUrl;

        /** READING | LISTENING. */
        private String passageType;

        private List<String> extraContents;
    }

    @Data
    public static class JsonQuestion {
        @JsonAlias("text")
        private String questionText;

        /** MCQ | MSQ | FILL_BLANK | ESSAY. Bỏ trống sẽ được suy ra từ số đáp án đúng. */
        @JsonAlias("type")
        private String questionType;

        private String explanation;
        private String collectionId;

        /**
         * Tên hoặc id phần thi, chỉ dùng khi tạo đề từ JSON. Bỏ trống sẽ lấy từ tiền tố tag
         * dạng "Phần thi > Tag". Import vào kho câu hỏi bỏ qua trường này.
         */
        @JsonAlias("part")
        private String examPart;

        private List<String> tagIds;

        @JsonAlias("tags")
        private List<String> tagNames;

        @JsonAlias("number")
        private Integer questionNumber;

        private List<JsonAnswer> answers;

        /** Chỉ có ý nghĩa với preview từ file Word; import JSON bỏ qua. */
        private Boolean needsManualCorrect;
    }

    @Data
    public static class JsonAnswer {
        /** A..J. Bỏ trống sẽ được gán tự động theo thứ tự. */
        @JsonAlias("label")
        private String answerLabel;

        @JsonAlias("text")
        private String answerText;

        @JsonAlias("correct")
        private Boolean isCorrect;

        /** Có trong output preview của file Word; import JSON luôn tạo đáp án mới nên bỏ qua. */
        private String answerId;
        private String questionId;
    }
}
