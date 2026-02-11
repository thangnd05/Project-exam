import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Row, Col, Spinner, Alert, Button } from "react-bootstrap";
import axios from 'axios';
import {
    IoRocketOutline,
    IoSettingsOutline,
    IoLayersOutline,
    IoCalendarOutline,
    IoTimeOutline,
    IoImageOutline,
    IoInformationCircleOutline,
    IoClose,
    IoSchoolOutline,
    IoBookOutline,
    IoMusicalNotesOutline
} from "react-icons/io5";
import { Trash, PlusCircle } from "lucide-react";
import classNames from "classnames/bind";
import { toast } from 'react-toastify';
import styles from "./CreateTestModal.module.scss";
import { useCreateTest } from "../../hook/useCreateTest";

const cx = classNames.bind(styles);

const CreateTestModal = ({
    show,
    onClose,
    mode = "personal",
    classId,
    chapterId,
    onSuccess
}) => {

    const {
        examTypes,
        examParts,
        testInfo,
        setTestInfo,
        questions,
        loading,
        notification,
        handleExamTypeChange,
        addQuestion,
        removeQuestion,
        updateQuestionText,
        updateAnswer,
        updateAudio,   // 👈 thêm audio
        handleSubmit,
    } = useCreateTest({ mode, classId, chapterId });

    const [className, setClassName] = useState('');
    const [chapterName, setChapterName] = useState('');

    useEffect(() => {
        if (mode === 'class' && show) {

            if (classId) {
                axios.get(`/api/classes/${classId}`)
                    .then(res => setClassName(res.data?.className || `Lớp ${classId}`))
                    .catch(() => setClassName(`Lớp ${classId}`));
            }

            if (chapterId) {
                axios.get(`/api/chapters/${chapterId}`)
                    .then(res => setChapterName(res.data?.title || `Chapter ${chapterId}`))
                    .catch(() => setChapterName(`Chapter ${chapterId}`));
            }
        }
    }, [mode, classId, chapterId, show]);

    if (!show) return null;

    const handleFormSubmit = async () => {
        const success = await handleSubmit();
        if (success && onSuccess) {
            toast.success('Đã tạo đề thi thành công! 🚀');
            onSuccess();
            onClose();
        }
    };

    return ReactDOM.createPortal(
        <div className={cx("modalOverlay")} onClick={onClose}>
            <div className={cx("modalContent")} onClick={(e) => e.stopPropagation()}>

                {/* HEADER */}
                <div className={cx("header")}>
                    <div className={cx("titleWrapper")}>
                        <IoRocketOutline />
                        <h3 className={cx("title")}>Kiến tạo bài thi</h3>
                        <span className={cx("badge")}>
                            {mode === "class" ? `Lớp: ${classId}` : "Cá nhân"}
                        </span>
                    </div>
                    <button className={cx("closeBtn")} onClick={onClose}>
                        <IoClose />
                    </button>
                </div>

                {/* BODY */}
                <div className={cx("body")}>

                    {notification.message && (
                        <Alert variant={notification.type} className="mb-3">
                            {notification.message}
                        </Alert>
                    )}

                    {/* CONFIG */}
                    <div className={cx("configCard")}>
                        <div className={cx("sectionTitle")}>
                            <IoSettingsOutline /> 1. Cấu hình bài thi
                        </div>

                        <Row className="g-3">

                            {mode === 'class' && (
                                <>
                                    <Col md={6}>
                                        <div className={cx("formGroupModern")}>
                                            <label><IoSchoolOutline /> Lớp học</label>
                                            <input
                                                className={cx("inputModern", "inputDisabled")}
                                                value={className}
                                                disabled
                                            />
                                        </div>
                                    </Col>
                                    <Col md={6}>
                                        <div className={cx("formGroupModern")}>
                                            <label><IoBookOutline /> Chương</label>
                                            <input
                                                className={cx("inputModern", "inputDisabled")}
                                                value={chapterName}
                                                disabled
                                            />
                                        </div>
                                    </Col>
                                </>
                            )}

                            <Col md={8}>
                                <div className={cx("formGroupModern")}>
                                    <label>Tiêu đề đề thi</label>
                                    <input
                                        className={cx("inputModern")}
                                        value={testInfo.title}
                                        onChange={(e) =>
                                            setTestInfo({ ...testInfo, title: e.target.value })
                                        }
                                    />
                                </div>
                            </Col>

                            <Col md={4}>
                                <div className={cx("formGroupModern")}>
                                    <label><IoImageOutline /> Link ảnh Banner</label>
                                    <input
                                        className={cx("inputModern")}
                                        value={testInfo.bannerUrl}
                                        onChange={(e) =>
                                            setTestInfo({ ...testInfo, bannerUrl: e.target.value })
                                        }
                                    />
                                </div>
                            </Col>

                            <Col md={3}>
                                <div className={cx("formGroupModern")}>
                                    <label>Loại kỳ thi</label>
                                    <select
                                        className={cx("inputModern")}
                                        value={testInfo.examTypeId}
                                        onChange={(e) =>
                                            handleExamTypeChange(e.target.value)
                                        }
                                    >
                                        <option value="">-- Chọn --</option>
                                        {examTypes.map((t) => (
                                            <option key={t.examTypeId} value={t.examTypeId}>
                                                {t.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </Col>

                            <Col md={3}>
                                <div className={cx("formGroupModern")}>
                                    <label>Phần thi</label>
                                    <select
                                        className={cx("inputModern")}
                                        value={testInfo.examPartId}
                                        onChange={(e) =>
                                            setTestInfo({ ...testInfo, examPartId: e.target.value })
                                        }
                                        disabled={!testInfo.examTypeId}
                                    >
                                        <option value="">-- Chọn part --</option>
                                        {examParts.map((p) => (
                                            <option key={p.examPartId} value={p.examPartId}>
                                                {p.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </Col>

                            <Col md={3}>
                                <div className={cx("formGroupModern")}>
                                    <label><IoTimeOutline /> Thời gian (phút)</label>
                                    <input
                                        type="number"
                                        className={cx("inputModern")}
                                        value={testInfo.durationMinutes}
                                        onChange={(e) =>
                                            setTestInfo({ ...testInfo, durationMinutes: e.target.value })
                                        }
                                    />
                                </div>
                            </Col>

                            <Col md={3}>
                                <div className={cx("formGroupModern")}>
                                    <label><IoRocketOutline /> Lượt làm tối đa</label>
                                    <input
                                        type="number"
                                        className={cx("inputModern")}
                                        value={testInfo.maxAttempts}
                                        onChange={(e) =>
                                            setTestInfo({ ...testInfo, maxAttempts: e.target.value })
                                        }
                                    />
                                </div>
                            </Col>

                            <Col md={6}>
                                <div className={cx("formGroupModern")}>
                                    <label><IoCalendarOutline /> Thời gian bắt đầu</label>
                                    <input
                                        type="datetime-local"
                                        className={cx("inputModern")}
                                        value={testInfo.availableFrom}
                                        onChange={(e) =>
                                            setTestInfo({ ...testInfo, availableFrom: e.target.value })
                                        }
                                    />
                                </div>
                            </Col>

                            <Col md={6}>
                                <div className={cx("formGroupModern")}>
                                    <label><IoCalendarOutline /> Thời gian kết thúc</label>
                                    <input
                                        type="datetime-local"
                                        className={cx("inputModern")}
                                        value={testInfo.availableTo}
                                        onChange={(e) =>
                                            setTestInfo({ ...testInfo, availableTo: e.target.value })
                                        }
                                    />
                                </div>
                            </Col>

                            <Col md={12}>
                                <div className={cx("formGroupModern")}>
                                    <label><IoInformationCircleOutline /> Mô tả</label>
                                    <textarea
                                        className={cx("inputModern")}
                                        rows={2}
                                        value={testInfo.description}
                                        onChange={(e) =>
                                            setTestInfo({ ...testInfo, description: e.target.value })
                                        }
                                    />
                                </div>
                            </Col>
                        </Row>
                    </div>

                    {/* QUESTIONS */}
                    <div className={cx("sectionTitle")}>
                        <IoLayersOutline /> 2. Danh sách câu hỏi ({questions.length})
                    </div>

                    {questions.map((q, i) => (
                        <div key={i} className={cx("partBlock")}>

                            <div className="d-flex justify-content-between align-items-center mb-2">
                                <b>Câu hỏi số {i + 1}</b>
                                <Button
                                    variant="link"
                                    className="text-danger p-0"
                                    onClick={() => removeQuestion(i)}
                                    disabled={questions.length === 1}
                                >
                                    <Trash size={18} />
                                </Button>
                            </div>

                            {/* QUESTION TEXT */}
                            <input
                                className={cx("inputModern", "mb-3")}
                                placeholder="Nhập nội dung câu hỏi..."
                                value={q.questionText}
                                onChange={(e) => updateQuestionText(i, e.target.value)}
                            />

                            {/* AUDIO UPLOAD */}
                            <div className="mb-3">
                                <label className="fw-bold mb-1">
                                    <IoMusicalNotesOutline /> Audio (nếu có)
                                </label>

                                <input
                                    type="file"
                                    accept="audio/*"
                                    className={cx("inputModern")}
                                    onChange={(e) =>
                                        updateAudio(i, e.target.files[0])
                                    }
                                />

                                {q.audioFile && (
                                    <audio controls className="mt-2 w-100">
                                        <source
                                            src={URL.createObjectURL(q.audioFile)}
                                        />
                                    </audio>
                                )}
                            </div>

                            {/* ANSWERS */}
                            <Row className="g-2">
                                {q.answers.map((ans, aIndex) => (
                                    <Col md={6} key={aIndex}>
                                        <div className={cx("answerItem")}>
                                            <input
                                                type="radio"
                                                name={`q-${i}`}
                                                checked={ans.isCorrect}
                                                onChange={(e) =>
                                                    updateAnswer(i, aIndex, "isCorrect", e.target.checked)
                                                }
                                            />
                                            <span className="ms-2 fw-bold">{ans.answerLabel}.</span>
                                            <input
                                                className={cx("inputModern", "ms-2")}
                                                value={ans.answerText}
                                                placeholder={`Đáp án ${ans.answerLabel || ans.label}`}
                                                onChange={(e) =>
                                                    updateAnswer(i, aIndex, "answerText", e.target.value)
                                                }
                                            />
                                        </div>
                                    </Col>
                                ))}
                            </Row>

                        </div>
                    ))}
                </div>

                {/* FOOTER */}
                <div className={cx("footer")}>
                    <button className={cx("btnAdd")} onClick={addQuestion}>
                        <PlusCircle size={18} /> Thêm câu hỏi
                    </button>

                    <button className={cx("btnCancel")} onClick={onClose}>
                        Để sau
                    </button>

                    <button
                        className={cx("btnSubmit")}
                        onClick={handleFormSubmit}
                        disabled={loading}
                    >
                        {loading ? <Spinner size="sm" /> : (
                            <>
                                <IoRocketOutline /> Lưu & Xuất bản
                            </>
                        )}
                    </button>
                </div>

            </div>
        </div>,
        document.body
    );
};

export default CreateTestModal;
