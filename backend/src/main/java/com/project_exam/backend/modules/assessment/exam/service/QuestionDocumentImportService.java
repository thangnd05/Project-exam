package com.project_exam.backend.modules.assessment.exam.service;

import com.project_exam.backend.modules.assessment.exam.domain.Question;
import com.project_exam.backend.modules.assessment.exam.dto.AnswerRequest;
import com.project_exam.backend.modules.assessment.exam.dto.NormalQuestionRequest;
import org.apache.poi.hwpf.HWPFDocument;
import org.apache.poi.hwpf.extractor.WordExtractor;
import org.apache.poi.xwpf.usermodel.*;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.zwobble.mammoth.DocumentConverter;
import org.zwobble.mammoth.Result;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class QuestionDocumentImportService {
    private static final Logger log = LoggerFactory.getLogger(QuestionDocumentImportService.class);

    // =========================================================================
    // CONFIG — đổi rule ở đây, không động logic bên dưới
    // =========================================================================

    /**
     * Nhãn đáp án hợp lệ. Đổi sang ["A","B","C","D","E"] nếu hỗ trợ 5 lựa chọn,
     * hoặc ["1","2","3","4"] nếu dùng số. Khi đổi PHẢI đồng bộ {@link #ALLOWED_LABEL_CLASS}.
     */
    private static final List<String> ALLOWED_LABELS = List.of("A", "B", "C", "D");

    /** Regex character-class tương ứng với {@link #ALLOWED_LABELS}. */
    private static final String ALLOWED_LABEL_CLASS = "[A-D]";

    /** Từ khoá mở đầu câu hỏi. Thêm "Q", "No" nếu cần. */
    private static final String QUESTION_KEYWORDS = "Câu|Question|Bài";

    /** Marker đặt cuối option để đánh dấu đáp án đúng. Vd: "A. London*". */
    private static final List<String> CORRECT_ANSWER_MARKERS = List.of("*");

    /**
     * Heuristic option dạng "A across" (không có dấu phân cách).
     * Vượt quá 2 ngưỡng này -> coi là stem "A ..." chứ không phải option A,
     * tránh nuốt câu dẫn trong đề TOEIC.
     */
    private static final int MAX_INLINE_OPTION_CHARS = 100;
    private static final int MAX_INLINE_OPTION_WORDS = 15;

    /** Cắt question text khi log để tránh spam. */
    private static final int LOG_QUESTION_PREVIEW_LIMIT = 120;

    /**
     * Dòng nên bỏ qua. Đặc thù môn Tiếng Anh — nếu import môn khác, chỉnh ở đây.
     * Lower-case khi so sánh.
     */
    private static final List<String> SKIPPABLE_PREFIXES = List.of(
            "part ",
            "choose the correct answer",
            "choose a, b, c, or d",
            "i."
    );

    private static final List<String> SKIPPABLE_CONTAINS = List.of(
            "reading & writing",
            "pronunciation in the following questions"
    );

    // =========================================================================
    // PATTERNS (build từ config phía trên)
    // =========================================================================

    // "21.", "Câu 21.", "(21).", "21", "21 nội dung"
    private static final Pattern QUESTION_START_PATTERN = Pattern.compile(
            "^\\s*(?:(?:" + QUESTION_KEYWORDS + ")\\s*)?\\(?(\\d+)\\)?"
                    + "\\s*(?:(?:[\\.:\\-\\)]\\s*(.*))|(\\S.*))?\\s*$",
            Pattern.CASE_INSENSITIVE
    );

    // A. / A) / A: / A- / A <text>
    // Negative lookahead (?![-_]{2,}) — sau separator/space, nếu là chuỗi gạch/gạch dưới
    // (fill-in-blank), KHÔNG coi là option line.
    private static final Pattern OPTION_PATTERN = Pattern.compile(
            "^\\s*(" + ALLOWED_LABEL_CLASS + ")(?:\\s*[\\.\\):\\-](?![-_]{2,})|\\s+(?![-_]{2,}))\\s*(.*)$",
            Pattern.CASE_INSENSITIVE
    );

    // Vị trí bắt đầu option trên cùng một dòng (dàn ngang nhiều đáp án).
    // - Có dấu phân cách -> chấp nhận đứng sau bất kỳ whitespace nào.
    // - Không dấu phân cách -> bắt buộc >=2 spaces hoặc Tab để tránh nuốt stem.
    // - Negative lookahead (?![-_]{2,}): nếu phía sau là chuỗi dấu gạch/gạch dưới
    //   (fill-in-blank cloze), KHÔNG coi là option. Tránh "began a ------- agreement"
    //   bị tách thành option A.
    private static final Pattern OPTION_LABEL_START = Pattern.compile(
            "(?:^|\\s)\\s*(" + ALLOWED_LABEL_CLASS + ")\\s*[\\.\\):\\-](?![-_]{2,})"
                    + "|(?:^|\\s{2,}|\\t)\\s*(" + ALLOWED_LABEL_CLASS + ")\\s+(?![-_]{2,})",
            Pattern.CASE_INSENSITIVE
    );

    // "B. READING & WRITING" — heading section, KHÔNG phải option
    // Yêu cầu body bắt đầu bằng CHỮ CÁI VIẾT HOA (không phải digit) để tránh
    // false positive với option dạng "A. 10", "B. 9", v.v.
    private static final Pattern SECTION_HEADING_OPTION_LIKE_PATTERN = Pattern.compile(
            "^" + ALLOWED_LABEL_CLASS + "\\.\\s*[A-Z][A-Z0-9\\s&/\\-,:]*$"
    );

    private static final Pattern PAGE_FOOTER_PATTERN =
            Pattern.compile("^\\s*trang\\s*\\d+\\s*/\\s*\\d+\\s*$", Pattern.CASE_INSENSITIVE);

    private static final Pattern EXAM_CODE_PATTERN =
            Pattern.compile("^\\s*m[aã]\\s*đ[ềe]\\s*\\d+\\s*$", Pattern.CASE_INSENSITIVE);

    // =========================================================================
    // ENTRY POINT
    // =========================================================================

    public List<NormalQuestionRequest> parseQuestionsFromDocument(MultipartFile file) throws IOException {
        List<ParsedLine> allLines = extractLinesFromDoc(file);
        List<NormalQuestionRequest> parsedQuestions = processLinesIntoQuestions(allLines);

        log.info(
                "Imported '{}' -> lines={}, questions={}",
                Optional.ofNullable(file.getOriginalFilename()).orElse("(unknown)"),
                allLines.size(),
                parsedQuestions.size()
        );
        return parsedQuestions;
    }

    // =========================================================================
    // EXTRACT LINES — .doc / .docx
    // =========================================================================

    private List<ParsedLine> extractLinesFromDoc(MultipartFile file) throws IOException {
        String filename = Optional.ofNullable(file.getOriginalFilename())
                .orElse("")
                .toLowerCase(Locale.ROOT);
        byte[] bytes = file.getBytes();

        if (filename.endsWith(".docx")) {
            return extractFromDocx(bytes);
        }
        if (filename.endsWith(".doc")) {
            return extractFromLegacyDoc(bytes);
        }
        throw new IOException("Unsupported file type. Only .doc and .docx are accepted.");
    }

    private List<ParsedLine> extractFromDocx(byte[] bytes) throws IOException {
        // Ưu tiên Mammoth (giữ được style qua HTML để detect đáp án đúng).
        // Fallback POI khi Mammoth không trả về gì.
        List<ParsedLine> mammothLines = extractLinesFromDocxWithMammoth(new ByteArrayInputStream(bytes));
        if (!mammothLines.isEmpty()) {
            return mammothLines;
        }
        List<ParsedLine> lines = new ArrayList<>();
        try (InputStream is = new ByteArrayInputStream(bytes);
             XWPFDocument docx = new XWPFDocument(is)) {
            extractLinesFromDocx(docx, lines);
        }
        return lines;
    }

    private List<ParsedLine> extractFromLegacyDoc(byte[] bytes) throws IOException {
        // Lưu ý: nhánh .doc KHÔNG detect được style (HWPF API hạn chế).
        // Đáp án bôi đậm trong .doc sẽ rơi vào needsManualCorrect.
        List<ParsedLine> lines = new ArrayList<>();
        try (InputStream is = new ByteArrayInputStream(bytes);
             HWPFDocument doc = new HWPFDocument(is);
             WordExtractor extractor = new WordExtractor(doc)) {
            for (String paraText : extractor.getParagraphText()) {
                if (paraText == null) {
                    continue;
                }
                appendPlainLines(paraText, lines);
            }
        }
        return lines;
    }

    private List<ParsedLine> extractLinesFromDocxWithMammoth(InputStream is) {
        try {
            DocumentConverter converter = new DocumentConverter();
            Result<String> result = converter.convertToHtml(is);
            String html = result.getValue();
            if (html == null || html.trim().isEmpty()) {
                return List.of();
            }
            Document dom = Jsoup.parse(html);
            Elements blocks = dom.select("p, li, td");
            List<ParsedLine> lines = new ArrayList<>();
            for (Element block : blocks) {
                String blockText = block.text();
                if (blockText == null || blockText.trim().isEmpty()) {
                    continue;
                }
                // Mammoth thường dùng strong/em/u; highlight có thể ra span style.
                String styledText = block.select("strong, b, u, em, mark, span[style]").text();
                String normalizedStyled = normalizeText(styledText);

                for (String logicalLine : blockText.split("\\R+")) {
                    String cleanLine = cleanWhitespace(logicalLine);
                    if (cleanLine.isEmpty()) {
                        continue;
                    }
                    for (String seg : splitLineByOptionLabels(cleanLine)) {
                        String cleanSeg = seg.trim();
                        if (cleanSeg.isEmpty()) {
                            continue;
                        }
                        boolean isStyled = getOptionLabel(cleanSeg) != null
                                && isStyledByHtmlSegment(normalizedStyled, cleanSeg);
                        lines.add(new ParsedLine(cleanSeg, isStyled));
                    }
                }
            }
            return lines;
        } catch (Exception e) {
            // Mammoth có thể throw nhiều loại exception (parser, IO).
            // Bắt rộng để fallback POI thay vì fail toàn bộ import.
            log.warn("Mammoth docx->html failed, fallback to POI parser: {}", e.getMessage());
            return List.of();
        }
    }

    private boolean isStyledByHtmlSegment(String normalizedStyledText, String segmentText) {
        if (normalizedStyledText == null || normalizedStyledText.isBlank()) {
            return false;
        }
        Matcher om = OPTION_PATTERN.matcher(segmentText);
        if (!om.matches()) {
            return false;
        }
        String label = normalizeText(om.group(1));
        String body = normalizeText(om.group(2));

        // (1) Nhãn được style: <strong>C.</strong> 15
        if (!label.isEmpty() && normalizedStyledText.contains(label)) {
            return true;
        }
        // (2) Nội dung được style/highlight: C. <strong>15</strong>
        return !body.isEmpty() && normalizedStyledText.contains(body);
    }

    private void extractLinesFromDocx(XWPFDocument docx, List<ParsedLine> lines) {
        for (XWPFParagraph para : docx.getParagraphs()) {
            processParagraph(para, lines);
        }
        for (XWPFTable table : docx.getTables()) {
            for (XWPFTableRow row : table.getRows()) {
                for (XWPFTableCell cell : row.getTableCells()) {
                    for (XWPFParagraph cellPara : cell.getParagraphs()) {
                        processParagraph(cellPara, lines);
                    }
                }
            }
        }
    }

    private void processParagraph(XWPFParagraph para, List<ParsedLine> lines) {
        String text = para.getParagraphText();
        if (text == null || text.trim().isEmpty()) {
            return;
        }
        for (String logicalLine : text.split("\\R+")) {
            String cleanLine = cleanWhitespace(logicalLine);
            if (cleanLine.isEmpty()) {
                continue;
            }
            for (String seg : splitLineByOptionLabels(cleanLine)) {
                String cleanSeg = seg.trim();
                if (cleanSeg.isEmpty()) {
                    continue;
                }
                boolean isStyled = getOptionLabel(cleanSeg) != null
                        && isOptionSegmentStyled(para, cleanSeg);
                lines.add(new ParsedLine(cleanSeg, isStyled));
            }
        }
    }

    private void appendPlainLines(String text, List<ParsedLine> lines) {
        if (text == null) {
            return;
        }
        for (String logicalLine : text.split("\\R+")) {
            String cleanLine = cleanWhitespace(logicalLine);
            if (cleanLine.isEmpty()) {
                continue;
            }
            for (String seg : splitLineByOptionLabels(cleanLine)) {
                String clean = seg.trim();
                if (!clean.isEmpty()) {
                    lines.add(new ParsedLine(clean, false));
                }
            }
        }
    }

    // =========================================================================
    // PROCESS LINES -> QUESTIONS
    // =========================================================================

    private List<NormalQuestionRequest> processLinesIntoQuestions(List<ParsedLine> lines) {
        List<NormalQuestionRequest> results = new ArrayList<>();
        ParsedQuestion current = null;
        String lastLabel = null;
        // Buffer các dòng "tail" sau khi câu hiện tại đã đủ options.
        // Dùng làm question text cho câu kế tiếp nếu câu đó thiếu số ở đầu.
        StringBuilder pendingText = new StringBuilder();

        for (ParsedLine pl : lines) {
            String text = pl.text;
            if (isSkippableLine(text)) {
                continue;
            }

            // (1) Câu hỏi mới explicit (có số ở đầu)
            Matcher qm = QUESTION_START_PATTERN.matcher(text);
            if (qm.matches()) {
                flushCurrent(current, results);
                pendingText.setLength(0);
                current = new ParsedQuestion(qm.group(1), extractQuestionText(qm));
                lastLabel = null;
                continue;
            }

            // (2) Dòng option A/B/C/D
            Matcher om = OPTION_PATTERN.matcher(text);
            if (om.matches() && current != null && !isSectionHeadingOptionLike(text)) {
                ParsedOption parsedOption = parseOptionText(om.group(2));
                if (isLikelyOptionLine(text, parsedOption.optionText)) {
                    String label = om.group(1).toUpperCase(Locale.ROOT);

                    // Label trùng -> 2 trường hợp:
                    //
                    // (a) Câu hiện tại đã (gần) đủ options -> đây là câu mới bị thiếu số.
                    //     Flush câu cũ, tạo câu mới với question text từ pendingText.
                    //
                    // (b) Câu hiện tại mới chỉ có 1-2 options -> option đầu nhiều khả năng
                    //     là FALSE POSITIVE (vd: dòng "A as a small family..." không có
                    //     dấu phân cách bị match nhãn A). Đẩy option cũ về question text
                    //     và cho option mới làm option thật, KHÔNG flush câu cũ.
                    if (current.options.containsKey(label)) {
                        boolean nearlyComplete = current.options.size() >= ALLOWED_LABELS.size() - 1;
                        if (nearlyComplete) {
                            log.warn(
                                    "Question no='{}' option '{}' duplicated -> treat as next question (missing number)",
                                    current.questionNumber,
                                    label
                            );
                            String prevNumber = current.questionNumber;
                            flushCurrent(current, results);
                            String inferredText = pendingText.toString().trim();
                            pendingText.setLength(0);
                            current = new ParsedQuestion("(after_" + prevNumber + ")", inferredText);
                            lastLabel = null;
                        } else {
                            String oldValue = current.options.get(label);
                            log.warn(
                                    "Question no='{}' option '{}' duplicated with only {} options"
                                            + " -> merge old option into question text (likely false positive)",
                                    current.questionNumber,
                                    label,
                                    current.options.size()
                            );
                            // Chỉ append body, KHÔNG thêm label.
                            // Lý do: noise thường có dạng "A as a small family..." nơi "as a small family..."
                            // chính là phần tiếp tục của câu hỏi. Thêm "A" sẽ tạo chữ in hoa kỳ quặc giữa câu.
                            // Dùng space (không phải \n) để câu liền mạch khi render trong UI.
                            current.questionText = appendLine(
                                    current.questionText,
                                    oldValue,
                                    " "
                            );
                            current.options.remove(label);
                            current.correctLabels.remove(label);
                        }
                    }

                    current.options.put(label, parsedOption.optionText);
                    lastLabel = label;
                    if (pl.isStyled || parsedOption.isMarkedCorrect) {
                        current.correctLabels.add(label);
                    }
                    continue;
                }
            }

            // (3) Dòng tiếp nối
            if (current == null) {
                continue;
            }
            if (current.options.isEmpty()) {
                // Chưa có option -> nối vào question text
                current.questionText = appendLine(current.questionText, text, "\n");
            } else if (current.options.size() >= ALLOWED_LABELS.size()) {
                // Đã đủ options -> KHÔNG nối vào option D nữa.
                // Lưu vào buffer; dùng làm question text cho câu mới ngầm (nếu có).
                if (pendingText.length() > 0) {
                    pendingText.append("\n");
                }
                pendingText.append(text);
            } else if (lastLabel != null) {
                // Chưa đủ options -> option có thể tràn dòng, nối vào option cuối
                String lastValue = current.options.getOrDefault(lastLabel, "");
                current.options.put(lastLabel, appendLine(lastValue, text, " "));
            }
        }

        flushCurrent(current, results);
        return results;
    }

    private void flushCurrent(ParsedQuestion current, List<NormalQuestionRequest> results) {
        if (current == null) {
            return;
        }
        if (isValidQuestion(current)) {
            results.add(buildRequest(current));
        } else {
            logInvalidQuestion(current);
        }
    }

    private String extractQuestionText(Matcher qm) {
        if (qm.groupCount() >= 2 && qm.group(2) != null) {
            return qm.group(2).trim();
        }
        if (qm.groupCount() >= 3 && qm.group(3) != null) {
            return qm.group(3).trim();
        }
        return "";
    }

    private String appendLine(String existing, String addition, String separator) {
        if (existing == null || existing.isBlank()) {
            return addition;
        }
        return (existing + separator + addition).trim();
    }

    private boolean isLikelyOptionLine(String rawLine, String optionText) {
        if (rawLine == null) {
            return false;
        }
        String trimmed = rawLine.replace('\u00A0', ' ').strip();
        if (trimmed.length() < 2) {
            return false;
        }
        // Có dấu phân cách (A. / A) / A: / A-) -> luôn là option.
        int i = 0;
        while (i < trimmed.length() && Character.isWhitespace(trimmed.charAt(i))) {
            i++;
        }
        if (i >= trimmed.length()) {
            return false;
        }
        i++; // skip label char
        while (i < trimmed.length() && Character.isWhitespace(trimmed.charAt(i))) {
            i++;
        }
        if (i < trimmed.length()) {
            char c = trimmed.charAt(i);
            if (c == '.' || c == ')' || c == ':' || c == '-') {
                return true;
            }
        }
        // Không có dấu phân cách -> dạng "A across".
        // Heuristic: option dạng này thường ngắn; loại "A <sentence...>".
        String t = optionText == null ? "" : optionText.trim();
        if (t.isEmpty()) {
            return false;
        }
        int wordCount = t.split("\\s+").length;
        return t.length() <= MAX_INLINE_OPTION_CHARS && wordCount <= MAX_INLINE_OPTION_WORDS;
    }

    /** Tách một dòng thành các đoạn bắt đầu bằng nhãn option (hỗ trợ dàn ngang nhiều đáp án). */
    private List<String> splitLineByOptionLabels(String line) {
        if (line == null || line.isBlank()) {
            return List.of();
        }
        Matcher m = OPTION_LABEL_START.matcher(line);
        List<Integer> starts = new ArrayList<>();
        while (m.find()) {
            // group 1: nhãn có dấu phân cách; group 2: nhãn không dấu phân cách
            int s = m.group(1) != null ? m.start(1) : m.start(2);
            starts.add(s);
        }
        if (starts.isEmpty()) {
            return List.of(line);
        }
        List<String> out = new ArrayList<>();
        // Giữ phần đầu (trước option đầu tiên) — thường là question text khi
        // câu hỏi và options nằm chung một dòng. Bản cũ vứt phần này -> mất số câu.
        int firstStart = starts.get(0);
        if (firstStart > 0) {
            String head = line.substring(0, firstStart).trim();
            if (!head.isEmpty()) {
                out.add(head);
            }
        }
        for (int i = 0; i < starts.size(); i++) {
            int from = starts.get(i);
            int to = i + 1 < starts.size() ? starts.get(i + 1) : line.length();
            String seg = line.substring(from, to).trim();
            if (!seg.isEmpty()) {
                out.add(seg);
            }
        }
        return out;
    }

    // =========================================================================
    // STYLE DETECTION (để tìm đáp án đúng qua bold/highlight/underline/màu)
    // =========================================================================

    private boolean isOptionSegmentStyled(XWPFParagraph para, String segmentText) {
        if (segmentText == null || segmentText.isBlank()) {
            return false;
        }
        String trimmedSeg = segmentText.trim();
        if (checkStyledRunsOverlapSegment(para, trimmedSeg)) {
            return true;
        }
        return fallbackStyledRunTouchesSegment(trimmedSeg, para);
    }

    private boolean checkStyledRunsOverlapSegment(XWPFParagraph para, String trimmedSeg) {
        String flat = paragraphTextFromRuns(para);
        if (flat.isEmpty()) {
            return false;
        }
        int idx = flat.indexOf(trimmedSeg);
        if (idx < 0) {
            return false;
        }
        int segStart = idx;
        int segEnd = idx + trimmedSeg.length();

        int pos = 0;
        for (XWPFRun run : para.getRuns()) {
            String rt = run.getText(0);
            if (rt == null) {
                continue;
            }
            int runStart = pos;
            int runEnd = pos + rt.length();
            if (isRunAnswerStyled(run) && runEnd > segStart && runStart < segEnd) {
                return true;
            }
            pos = runEnd;
        }
        return false;
    }

    /**
     * Khi text từ runs và getParagraphText() lệch nhau (do field code, bookmark, ...):
     * gần đúng theo từng run trong segment.
     * Run 1 ký tự: chỉ nhận chữ số nếu khớp phần nội dung đáp án.
     */
    private boolean fallbackStyledRunTouchesSegment(String trimmedSeg, XWPFParagraph para) {
        String normSeg = normalizeText(trimmedSeg);
        for (XWPFRun run : para.getRuns()) {
            String runText = run.getText(0);
            if (runText == null || !isRunAnswerStyled(run)) {
                continue;
            }
            String t = runText.trim();
            if (t.isEmpty()) {
                continue;
            }
            if (t.length() == 1) {
                if (Character.isDigit(t.charAt(0)) && singleDigitStyledMatchesOptionBody(trimmedSeg, t)) {
                    return true;
                }
                continue;
            }
            if (trimmedSeg.contains(t)
                    || (normalizeText(t).length() >= 3 && normSeg.contains(normalizeText(t)))) {
                return true;
            }
        }
        return false;
    }

    /** Tránh contains("5") khớp nhầm: chỉ khi body đúng chữ số đó hoặc kết thúc bằng chữ số đó. */
    private boolean singleDigitStyledMatchesOptionBody(String trimmedSeg, String digit) {
        Matcher om = OPTION_PATTERN.matcher(trimmedSeg);
        if (!om.matches()) {
            return false;
        }
        String body = om.group(2) == null ? "" : om.group(2).trim();
        if (body.isEmpty()) {
            return false;
        }
        return body.equals(digit) || body.endsWith(digit);
    }

    private String paragraphTextFromRuns(XWPFParagraph para) {
        StringBuilder sb = new StringBuilder();
        for (XWPFRun run : para.getRuns()) {
            String t = run.getText(0);
            if (t != null) {
                sb.append(t);
            }
        }
        return sb.toString();
    }

    private boolean isRunAnswerStyled(XWPFRun run) {
        return run.isBold()
                || isColoredRun(run)
                || isHighlightedRun(run)
                || run.getUnderline() != UnderlinePatterns.NONE;
    }

    private boolean isColoredRun(XWPFRun run) {
        String color = run.getColor();
        return color != null
                && !color.isBlank()
                && !"auto".equalsIgnoreCase(color)
                && !"000000".equalsIgnoreCase(color);
    }

    private boolean isHighlightedRun(XWPFRun run) {
        return run.getTextHightlightColor() != null
                && !"none".equalsIgnoreCase(String.valueOf(run.getTextHightlightColor()));
    }

    // =========================================================================
    // HELPERS
    // =========================================================================

    private ParsedOption parseOptionText(String rawOptionText) {
        if (rawOptionText == null) {
            return new ParsedOption("", false);
        }
        String trimmed = rawOptionText.trim();
        for (String marker : CORRECT_ANSWER_MARKERS) {
            if (trimmed.endsWith(marker)) {
                String cleaned = trimmed.substring(0, trimmed.length() - marker.length()).trim();
                return new ParsedOption(cleaned, true);
            }
        }
        return new ParsedOption(trimmed, false);
    }

    private boolean isSectionHeadingOptionLike(String text) {
        return SECTION_HEADING_OPTION_LIKE_PATTERN.matcher(text).matches();
    }

    private boolean isSkippableLine(String text) {
        String trimmed = text == null ? "" : text.trim();
        if (trimmed.isEmpty()) {
            return true;
        }
        if (PAGE_FOOTER_PATTERN.matcher(trimmed).matches() || EXAM_CODE_PATTERN.matcher(trimmed).matches()) {
            return true;
        }
        String lower = trimmed.toLowerCase(Locale.ROOT);
        for (String prefix : SKIPPABLE_PREFIXES) {
            if (lower.startsWith(prefix)) {
                return true;
            }
        }
        for (String keyword : SKIPPABLE_CONTAINS) {
            if (lower.contains(keyword)) {
                return true;
            }
        }
        return false;
    }

    private String getOptionLabel(String text) {
        Matcher m = OPTION_PATTERN.matcher(text);
        return m.matches() ? m.group(1).toUpperCase(Locale.ROOT) : null;
    }

    private String cleanWhitespace(String s) {
        return s == null ? "" : s.replace('\u00A0', ' ').trim();
    }

    private String normalizeText(String text) {
        return text.toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", " ")
                .trim()
                .replaceAll("\\s+", " ");
    }

    private boolean isValidQuestion(ParsedQuestion q) {
        return q.options.size() >= 2;
    }

    private NormalQuestionRequest buildRequest(ParsedQuestion q) {
        Set<String> correctLabels = normalizeCorrectLabels(q);
        List<AnswerRequest> answers = new ArrayList<>();
        for (String label : ALLOWED_LABELS) {
            if (q.options.containsKey(label)) {
                boolean isCorrect = correctLabels.contains(label);
                answers.add(new AnswerRequest(null, q.options.get(label), isCorrect, label));
            }
        }
        String questionText = q.questionText == null ? "" : q.questionText.trim();
        NormalQuestionRequest request = new NormalQuestionRequest();
        request.setQuestionText(questionText);
        // NOTE: hiện tại import chỉ hỗ trợ MCQ. Nếu mở rộng (T/F, multi-select)
        // cần đổi cả ở đây và ở normalizeCorrectLabels.
        request.setQuestionType(Question.QuestionType.MCQ);
        request.setAnswers(answers);
        request.setNeedsManualCorrect(correctLabels.isEmpty());
        return request;
    }

    private Set<String> normalizeCorrectLabels(ParsedQuestion q) {
        // MCQ single-correct: nếu có >1 đáp án bị bôi đậm thì bảo thủ -> clear hết,
        // để người duyệt chọn tay, tránh import sai.
        if (q.correctLabels.size() <= 1) {
            return q.correctLabels;
        }
        log.warn(
                "Question no='{}' has multiple styled correct answers {} -> clear to avoid wrong import",
                q.questionNumber,
                q.correctLabels
        );
        return Collections.emptySet();
    }

    private void logInvalidQuestion(ParsedQuestion q) {
        String preview = q.questionText == null ? "" : q.questionText.trim();
        if (preview.length() > LOG_QUESTION_PREVIEW_LIMIT) {
            preview = preview.substring(0, LOG_QUESTION_PREVIEW_LIMIT) + "...";
        }
        log.warn(
                "Skip invalid question no='{}' options={} labels={} question='{}'",
                q.questionNumber,
                q.options.keySet(),
                q.correctLabels,
                preview
        );
    }

    // =========================================================================
    // VALUE OBJECTS
    // =========================================================================

    private static class ParsedLine {
        final String text;
        final boolean isStyled;

        ParsedLine(String text, boolean isStyled) {
            this.text = text;
            this.isStyled = isStyled;
        }
    }

    private static class ParsedQuestion {
        final String questionNumber;
        String questionText;
        final Map<String, String> options = new LinkedHashMap<>();
        final Set<String> correctLabels = new HashSet<>();

        ParsedQuestion(String number, String text) {
            this.questionNumber = number;
            this.questionText = text;
        }
    }

    private static class ParsedOption {
        final String optionText;
        final boolean isMarkedCorrect;

        ParsedOption(String optionText, boolean isMarkedCorrect) {
            this.optionText = optionText;
            this.isMarkedCorrect = isMarkedCorrect;
        }
    }
}