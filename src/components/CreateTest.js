import { Container, Row, Col, Spinner, Alert, Button } from "react-bootstrap";
import {
    IoRocketOutline,
    IoSettingsOutline,
    IoLayersOutline,
    IoCalendarOutline,
    IoTimeOutline,
    IoImageOutline,
    IoInformationCircleOutline
} from "react-icons/io5";
import { Trash, PlusCircle } from "lucide-react";
import classNames from "classnames/bind";
import styles from "./CreateTestPage.module.scss";
import { useCreateTest } from "../hook/useCreateTest";

const cx = classNames.bind(styles);

function CreateTest({ mode = "personal", classId, chapterId }) {
    const {
        examTypes, examParts, testInfo, setTestInfo, questions, loading, notification,
        handleExamTypeChange, addQuestion, removeQuestion, updateQuestionText, updateAnswer, handleSubmit,
    } = useCreateTest({ mode, classId, chapterId });

    return (
        <div className={cx("wrapper")}>
            <Container>
                <div className={cx("header")}>
                    <h1>Kiến tạo bài thi</h1>
                    <p className="badge bg-info text-dark">
                        {mode === "class" ? `Đang tạo cho Lớp: ${classId}` : "Chế độ: Cá nhân"}
                    </p>
                </div>

                {notification.message && (
                    <Alert variant={notification.type} className="mt-3">
                        {notification.message}
                    </Alert>
                )}

                {/* THIẾT LẬP CƠ BẢN */}
                <div className={cx("config-card")}>
                    <div className={cx("section-title")}>
                        <IoSettingsOutline /> 1. Cấu hình bài thi
                    </div>

                    <Row className="g-3">
                        <Col md={8}>
                            <div className={cx("form-group-modern")}>
                                <label>Tiêu đề đề thi</label>
                                <input
                                    className={cx("input-modern")}
                                    placeholder="Nhập tên bài kiểm tra..."
                                    value={testInfo.title}
                                    onChange={(e) => setTestInfo({ ...testInfo, title: e.target.value })}
                                />
                            </div>
                        </Col>
                        <Col md={4}>
                            <div className={cx("form-group-modern")}>
                                <label><IoImageOutline /> Link ảnh Banner</label>
                                <input
                                    className={cx("input-modern")}
                                    placeholder="URL hình ảnh bài thi..."
                                    value={testInfo.bannerUrl}
                                    onChange={(e) => setTestInfo({ ...testInfo, bannerUrl: e.target.value })}
                                />
                            </div>
                        </Col>

                        <Col md={3}>
                            <div className={cx("form-group-modern")}>
                                <label>Loại kỳ thi</label>
                                <select
                                    className={cx("input-modern")}
                                    value={testInfo.examTypeId}
                                    onChange={(e) => handleExamTypeChange(e.target.value)}
                                >
                                    <option value="">-- Chọn --</option>
                                    {examTypes.map((t) => <option key={t.examTypeId} value={t.examTypeId}>{t.name}</option>)}
                                </select>
                            </div>
                        </Col>

                        <Col md={3}>
                            <div className={cx("form-group-modern")}>
                                <label>Phần thi (Part)</label>
                                <select
                                    className={cx("input-modern")}
                                    value={testInfo.examPartId}
                                    onChange={(e) => setTestInfo({ ...testInfo, examPartId: e.target.value })}
                                    disabled={!testInfo.examTypeId}
                                >
                                    <option value="">-- Chọn part --</option>
                                    {examParts.map((p) => <option key={p.examPartId} value={p.examPartId}>{p.name}</option>)}
                                </select>
                            </div>
                        </Col>

                        <Col md={3}>
                            <div className={cx("form-group-modern")}>
                                <label><IoTimeOutline /> Thời gian (phút)</label>
                                <input
                                    type="number"
                                    className={cx("input-modern")}
                                    value={testInfo.durationMinutes}
                                    onChange={(e) => setTestInfo({ ...testInfo, durationMinutes: e.target.value })}
                                />
                            </div>
                        </Col>

                        <Col md={3}>
                            <div className={cx("form-group-modern")}>
                                <label><IoRocketOutline /> Lượt làm tối đa</label>
                                <input
                                    type="number"
                                    className={cx("input-modern")}
                                    value={testInfo.maxAttempts}
                                    onChange={(e) => setTestInfo({ ...testInfo, maxAttempts: e.target.value })}
                                />
                            </div>
                        </Col>

                        <Col md={6}>
                            <div className={cx("form-group-modern")}>
                                <label><IoCalendarOutline /> Thời gian bắt đầu</label>
                                <input
                                    type="datetime-local"
                                    className={cx("input-modern")}
                                    value={testInfo.availableFrom}
                                    onChange={(e) => setTestInfo({ ...testInfo, availableFrom: e.target.value })}
                                />
                            </div>
                        </Col>

                        <Col md={6}>
                            <div className={cx("form-group-modern")}>
                                <label><IoCalendarOutline /> Thời gian kết thúc</label>
                                <input
                                    type="datetime-local"
                                    className={cx("input-modern")}
                                    value={testInfo.availableTo}
                                    onChange={(e) => setTestInfo({ ...testInfo, availableTo: e.target.value })}
                                />
                            </div>
                        </Col>

                        <Col md={12}>
                            <div className={cx("form-group-modern")}>
                                <label><IoInformationCircleOutline /> Mô tả bài thi</label>
                                <textarea
                                    className={cx("input-modern")}
                                    rows={2}
                                    value={testInfo.description}
                                    onChange={(e) => setTestInfo({ ...testInfo, description: e.target.value })}
                                />
                            </div>
                        </Col>
                    </Row>
                </div>

                {/* DANH SÁCH CÂU HỎI */}
                <div className={cx("section-title")}>
                    <IoLayersOutline /> 2. Danh sách câu hỏi ({questions.length})
                </div>

                {questions.map((q, i) => (
                    <div key={i} className={cx("part-block")}>
                        <div className="d-flex justify-content-between align-items-center mb-2">
                            <b>Câu hỏi số {i + 1}</b>
                            <Button variant="link" className="text-danger p-0" onClick={() => removeQuestion(i)} disabled={questions.length === 1}>
                                <Trash size={18} />
                            </Button>
                        </div>

                        <input
                            className={cx("input-modern", "mb-3")}
                            placeholder="Nhập nội dung câu hỏi..."
                            value={q.questionText}
                            onChange={(e) => updateQuestionText(i, e.target.value)}
                        />

                        <Row className="g-2">
                            {q.answers.map((ans, aIndex) => (
                                <Col md={6} key={aIndex}>
                                    <div className={cx("answer-item")}>
                                        <input
                                            type="radio"
                                            name={`q-${i}`}
                                            checked={ans.isCorrect}
                                            onChange={(e) => updateAnswer(i, aIndex, "isCorrect", e.target.checked)}
                                        />
                                        <span className="ms-2 fw-bold">{ans.label}.</span>
                                        <input
                                            className={cx("input-modern", "ms-2")}
                                            value={ans.answerText}
                                            placeholder={`Đáp án ${ans.label}`}
                                            onChange={(e) => updateAnswer(i, aIndex, "answerText", e.target.value)}
                                        />
                                    </div>
                                </Col>
                            ))}
                        </Row>
                    </div>
                ))}

                <div className="mt-3 mb-5 d-flex gap-3">
                    <Button variant="outline-primary" className={cx("btn-add")} onClick={addQuestion}>
                        <PlusCircle size={18} className="me-1" /> Thêm câu hỏi
                    </Button>

                    <Button
                        className={cx("btn-create-large")}
                        onClick={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? <Spinner size="sm" /> : (
                            <>
                                <IoRocketOutline /> Lưu & Xuất bản bài thi
                            </>
                        )}
                    </Button>
                </div>
            </Container>
        </div>
    );
}

export default CreateTest;