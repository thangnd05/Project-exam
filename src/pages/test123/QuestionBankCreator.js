import React, { useState } from 'react';
import axios from 'axios';
import classNames from 'classnames/bind';
import { toast } from 'react-toastify';
import {
    IoAddOutline,
    IoTrashOutline,
    IoCloudUploadOutline,
    IoDocumentsOutline,
    IoListOutline,
    IoDocumentTextOutline,
    IoMusicalNotesOutline,
    IoSchoolOutline,
    IoBookOutline,
    IoLayersOutline,
    IoCheckmarkCircleOutline
} from 'react-icons/io5';

import styles from './QuestionBankCreator.module.scss';

const cx = classNames.bind(styles);

const MODES = {
    SINGLE: 'SINGLE',
    BULK_PASSAGE: 'BULK_PASSAGE',
    BULK_INDEPENDENT: 'BULK_INDEPENDENT',
    BULK_INDEPENDENT_AUDIO: 'BULK_INDEPENDENT_AUDIO'
};

const INITIAL_ANSWER = { content: '', isCorrect: false };
const INITIAL_QUESTION = {
    questionText: '',
    questionType: 'MCQ',
    audioFile: null,
    answers: [
        { answerLabel: 'A', ...INITIAL_ANSWER },
        { answerLabel: 'B', ...INITIAL_ANSWER },
        { answerLabel: 'C', ...INITIAL_ANSWER },
        { answerLabel: 'D', ...INITIAL_ANSWER }
    ]
};

const QuestionBankCreator = () => {
    const [mode, setMode] = useState(MODES.SINGLE);
    const [examTypes, setExamTypes] = useState([]);
    const [examParts, setExamParts] = useState([]);
    const [classes, setClasses] = useState([]);

    const [examTypeId, setExamTypeId] = useState('');
    const [examPartId, setExamPartId] = useState('');
    const [classId, setClassId] = useState('');
    const [chapterId, setChapterId] = useState('');

    // Shared state
    const [passage, setPassage] = useState({
        content: '',
        passageType: 'READING',
        mediaUrl: ''
    });
    const [audioFile, setAudioFile] = useState(null);

    // Questions state
    const [questions, setQuestions] = useState([{ ...INITIAL_QUESTION, answers: INITIAL_QUESTION.answers.map(a => ({ ...a })) }]);

    // ===== Load base data =====
    React.useEffect(() => {
        axios.get('/api/exam-types').then(res => setExamTypes(res.data || []));
        axios.get('/api/classes/my').then(res => setClasses(Array.isArray(res.data) ? res.data : (res.data.classes || [])));
    }, []);

    React.useEffect(() => {
        if (!examTypeId) {
            setExamParts([]);
            return;
        }
        axios.get(`/api/exam-parts/by-exam-type/${examTypeId}`).then(res => setExamParts(res.data || []));
    }, [examTypeId]);

    const handleAddQuestion = () => {
        setQuestions([...questions, { ...INITIAL_QUESTION, answers: INITIAL_QUESTION.answers.map(a => ({ ...a })) }]);
    };

    const handleRemoveQuestion = (index) => {
        const newQuestions = questions.filter((_, i) => i !== index);
        setQuestions(newQuestions);
    };

    const handleQuestionChange = (index, field, value) => {
        const newQuestions = [...questions];
        newQuestions[index][field] = value;
        setQuestions(newQuestions);
    };

    const handleAnswerChange = (qIndex, aIndex, field, value) => {
        const newQuestions = [...questions];
        if (field === 'isCorrect') {
            // MCQ Style: only one correct
            newQuestions[qIndex].answers.forEach((ans, i) => {
                ans.isCorrect = i === aIndex;
            });
        } else {
            newQuestions[qIndex].answers[aIndex][field] = value;
        }
        setQuestions(newQuestions);
    };

    const handleSubmit = async () => {
        if (!examPartId) {
            toast.warn('Vui lòng nhập Exam Part ID');
            return;
        }

        try {
            const formData = new FormData();
            const baseUrl = '/api/questions';

            const requestData = {
                examPartId: Number(examPartId),
                classId: classId ? Number(classId) : null,
                chapterId: chapterId ? Number(chapterId) : null,
            };

            if (mode === MODES.SINGLE) {
                const payload = {
                    ...requestData,
                    ...questions[0],
                    passage: (passage.content || passage.mediaUrl || audioFile) ? passage : null,
                };
                // For single with audio, we might need multipart or just post JSON if no file
                if (audioFile) {
                    const singleForm = new FormData();
                    singleForm.append('request', JSON.stringify({ ...payload, passage: { ...passage, passageType: 'LISTENING' } }));
                    singleForm.append('audio', audioFile);
                    await axios.post(`${baseUrl}/bulk-with-passage`, singleForm); // Use bulk endpoint for consistency if has audio
                } else {
                    await axios.post(baseUrl, payload);
                }
            }
            else if (mode === MODES.BULK_PASSAGE) {
                requestData.passage = passage;
                requestData.questions = questions.map(q => ({
                    questionType: q.questionType,
                    questionText: q.questionText,
                    answers: q.answers
                }));

                formData.append('request', JSON.stringify(requestData));
                if (audioFile) formData.append('audio', audioFile);
                await axios.post(`${baseUrl}/bulk-with-passage`, formData);
            }
            else if (mode === MODES.BULK_INDEPENDENT) {
                requestData.questions = questions.map(q => ({
                    questionType: q.questionType,
                    questionText: q.questionText,
                    answers: q.answers
                }));
                await axios.post(`${baseUrl}/bulk`, requestData);
            }
            else if (mode === MODES.BULK_INDEPENDENT_AUDIO) {
                requestData.questions = questions.map(q => ({
                    questionType: q.questionType,
                    questionText: q.questionText,
                    passage: q.audioFile ? { passageType: "LISTENING", content: "" } : null,
                    answers: q.answers
                }));

                formData.append('data', JSON.stringify(requestData));
                questions.forEach(q => {
                    if (q.audioFile) formData.append('audioFiles', q.audioFile);
                });
                await axios.post(`${baseUrl}/bulk-independent-with-audio`, formData);
            }

            toast.success('🎉 Đã lưu toàn bộ câu hỏi vào kho!');
        } catch (error) {
            console.error('Error creating questions:', error);
            toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi tạo câu hỏi.');
        }
    };

    return (
        <div className={cx('wrapper')}>
            <div className={cx('container')}>
                <div className={cx('header')}>
                    <h1>Premium Question Builder</h1>
                    <p>Công cụ khởi tạo ngân hàng câu hỏi đa năng, mạnh mẽ</p>
                </div>

                <div className={cx('modeSelector')}>
                    <button
                        className={cx('modeBtn', { active: mode === MODES.SINGLE })}
                        onClick={() => setMode(MODES.SINGLE)}
                    >
                        <IoDocumentTextOutline size={18} /> Đơn lẻ
                    </button>
                    <button
                        className={cx('modeBtn', { active: mode === MODES.BULK_PASSAGE })}
                        onClick={() => setMode(MODES.BULK_PASSAGE)}
                    >
                        <IoDocumentsOutline size={18} /> Shared Passage
                    </button>
                    <button
                        className={cx('modeBtn', { active: mode === MODES.BULK_INDEPENDENT_AUDIO })}
                        onClick={() => setMode(MODES.BULK_INDEPENDENT_AUDIO)}
                    >
                        <IoMusicalNotesOutline size={18} /> Multi-Audio
                    </button>
                    <button
                        className={cx('modeBtn', { active: mode === MODES.BULK_INDEPENDENT })}
                        onClick={() => setMode(MODES.BULK_INDEPENDENT)}
                    >
                        <IoListOutline size={18} /> Bulk Text
                    </button>
                </div>

                {/* Common Info */}
                <div className={cx('formSection')}>
                    <h3><IoSchoolOutline /> Thông tin chung</h3>
                    <div className={cx('answerGrid')}>
                        <div className={cx('inputGroup')}>
                            <label>Loại kỳ thi</label>
                            <select
                                value={examTypeId}
                                onChange={(e) => setExamTypeId(e.target.value)}
                            >
                                <option value="">-- Chọn kỳ thi --</option>
                                {examTypes.map(et => (
                                    <option key={et.examTypeId} value={et.examTypeId}>{et.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className={cx('inputGroup')}>
                            <label>Phần thi (Part) *</label>
                            <select
                                value={examPartId}
                                onChange={(e) => setExamPartId(e.target.value)}
                                disabled={!examTypeId}
                            >
                                <option value="">-- Chọn phần thi --</option>
                                {examParts.map(p => (
                                    <option key={p.examPartId} value={p.examPartId}>{p.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className={cx('inputGroup')}>
                            <label>Lớp học (Tuỳ chọn)</label>
                            <select
                                value={classId}
                                onChange={(e) => setClassId(e.target.value)}
                            >
                                <option value="">-- Không chọn --</option>
                                {classes.map(c => (
                                    <option key={c.classId} value={c.classId}>{c.className}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Shared Passage Section */}
                {(mode === MODES.SINGLE || mode === MODES.BULK_PASSAGE) && (
                    <div className={cx('formSection')}>
                        <h3><IoBookOutline /> Shared Passage (Nội dung chung)</h3>
                        <div className={cx('inputGroup')}>
                            <label>Loại nội dung</label>
                            <select
                                value={passage.passageType}
                                onChange={(e) => setPassage({ ...passage, passageType: e.target.value })}
                            >
                                <option value="READING">Văn bản (Reading)</option>
                                <option value="LISTENING">Âm thanh (Listening)</option>
                            </select>
                        </div>
                        {passage.passageType === 'READING' ? (
                            <div className={cx('inputGroup')}>
                                <label>Nội dung đoạn văn</label>
                                <textarea
                                    value={passage.content}
                                    onChange={(e) => setPassage({ ...passage, content: e.target.value })}
                                    placeholder="Nhập nội dung đoạn văn bài đọc..."
                                />
                            </div>
                        ) : (
                            <div className={cx('inputGroup')}>
                                <label>Tải lên File Audio chung</label>
                                <input
                                    type="file"
                                    accept="audio/*"
                                    onChange={(e) => setAudioFile(e.target.files[0])}
                                    className={cx('input-modern')}
                                />
                                {audioFile && (
                                    <div className="mt-2">
                                        <audio controls src={URL.createObjectURL(audioFile)} style={{ width: '100%' }} />
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Questions Section */}
                <div className={cx('formSection')}>
                    <h3><IoLayersOutline /> Danh sách câu hỏi ({questions.length})</h3>
                    {questions.map((q, qIndex) => (
                        <div key={qIndex} className={cx('questionItem')}>
                            {questions.length > 1 && (
                                <button className={cx('removeBtn')} onClick={() => handleRemoveQuestion(qIndex)}>
                                    <IoTrashOutline size={20} />
                                </button>
                            )}
                            <div className={cx('inputGroup')}>
                                <label className="fw-bold">Câu hỏi {qIndex + 1}</label>
                                <textarea
                                    className={cx('input-modern')}
                                    rows={2}
                                    value={q.questionText}
                                    onChange={(e) => handleQuestionChange(qIndex, 'questionText', e.target.value)}
                                    placeholder="Nhập nội dung câu hỏi..."
                                />
                            </div>

                            {/* Per-question Audio for Independent mode */}
                            {mode === MODES.BULK_INDEPENDENT_AUDIO && (
                                <div className="mb-3 p-3 bg-light rounded-3 border">
                                    <label className="fw-bold mb-2 d-flex align-items-center gap-2">
                                        <IoMusicalNotesOutline className="text-primary" /> Audio riêng cho câu này
                                    </label>
                                    <input
                                        type="file"
                                        accept="audio/*"
                                        onChange={(e) => handleQuestionChange(qIndex, 'audioFile', e.target.files[0])}
                                    />
                                    {q.audioFile && (
                                        <div className="mt-2">
                                            <audio controls src={URL.createObjectURL(q.audioFile)} style={{ width: '100%' }} />
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className={cx('answerGrid')}>
                                {q.answers.map((a, aIndex) => (
                                    <div key={aIndex} className={cx('answerItem', { correct: a.isCorrect })}>
                                        <input
                                            type="radio"
                                            name={`q-${qIndex}`}
                                            className={cx('checkbox')}
                                            checked={a.isCorrect}
                                            onChange={(e) => handleAnswerChange(qIndex, aIndex, 'isCorrect', e.target.checked)}
                                        />
                                        <b className="ms-1">{a.answerLabel || a.label}.</b>
                                        <input
                                            type="text"
                                            className={cx('input-modern')}
                                            value={a.content}
                                            onChange={(e) => handleAnswerChange(qIndex, aIndex, 'content', e.target.value)}
                                            placeholder={`Đáp án ${a.answerLabel || a.label}`}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}

                    {(mode !== MODES.SINGLE) && (
                        <button className={cx('btnSecondary')} onClick={handleAddQuestion} style={{ width: '100%', marginTop: '12px', borderStyle: 'dashed' }}>
                            <IoAddOutline size={20} /> Thêm câu hỏi tiếp theo
                        </button>
                    )}
                </div>

                <div className={cx('btnActions')}>
                    <button className={cx('btnPrimary')} onClick={handleSubmit} style={{ height: '60px', borderRadius: '18px' }}>
                        <IoCheckmarkCircleOutline size={26} />
                        Xác nhận & Lưu {questions.length} câu hỏi vào kho
                    </button>
                </div>
            </div>
        </div>
    );
};

export default QuestionBankCreator;
