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
    IoDocumentTextOutline
} from 'react-icons/io5';

import styles from './QuestionBankCreator.module.scss';

const cx = classNames.bind(styles);

const MODES = {
    SINGLE: 'SINGLE',
    BULK_PASSAGE: 'BULK_PASSAGE',
    BULK_NO_PASSAGE: 'BULK_NO_PASSAGE'
};

const INITIAL_ANSWER = { content: '', isCorrect: false };
const INITIAL_QUESTION = {
    questionText: '',
    questionType: 'SINGLE_CHOICE',
    answers: [
        { ...INITIAL_ANSWER },
        { ...INITIAL_ANSWER },
        { ...INITIAL_ANSWER },
        { ...INITIAL_ANSWER }
    ]
};

const QuestionBankCreator = () => {
    const [mode, setMode] = useState(MODES.SINGLE);
    const [examPartId, setExamPartId] = useState('');
    const [classId, setClassId] = useState('');
    const [chapterId, setChapterId] = useState('');

    // Passage state
    const [passage, setPassage] = useState({
        content: '',
        passageType: 'READING',
        mediaUrl: ''
    });
    const [audioFile, setAudioFile] = useState(null);

    // Questions state
    const [questions, setQuestions] = useState([{ ...INITIAL_QUESTION }]);

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
        if (field === 'isCorrect' && newQuestions[qIndex].questionType === 'SINGLE_CHOICE') {
            // Reset all others to false for single choice
            newQuestions[qIndex].answers.forEach((ans, i) => {
                ans.isCorrect = i === aIndex;
            });
        } else {
            newQuestions[qIndex].answers[aIndex][field] = value;
        }
        setQuestions(newQuestions);
    };

    const handleSubmit = async () => {
        try {
            const baseUrl = 'http://localhost:8080/api/questions'; // Adjust accordingly
            const token = localStorage.getItem('token');
            const config = {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            };

            if (mode === MODES.SINGLE) {
                const payload = {
                    examPartId,
                    classId,
                    chapterId,
                    passage: passage.content || passage.mediaUrl ? passage : null,
                    ...questions[0]
                };
                await axios.post(baseUrl, payload, config);
            }
            else if (mode === MODES.BULK_NO_PASSAGE) {
                const payload = {
                    examPartId,
                    classId,
                    chapterId,
                    questions: questions
                };
                await axios.post(`${baseUrl}/bulk`, payload, config);
            }
            else if (mode === MODES.BULK_PASSAGE) {
                const requestData = {
                    examPartId,
                    classId,
                    chapterId,
                    passage: passage,
                    questions: questions
                };

                const formData = new FormData();
                formData.append('request', JSON.stringify(requestData));
                if (audioFile) {
                    formData.append('audio', audioFile);
                }

                await axios.post(`${baseUrl}/bulk-with-passage`, formData, {
                    ...config,
                    headers: {
                        ...config.headers,
                        'Content-Type': 'multipart/form-data'
                    }
                });
            }

            toast.success('Tạo câu hỏi thành công!');
        } catch (error) {
            console.error('Error creating questions:', error);
            toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi tạo câu hỏi.');
        }
    };

    return (
        <div className={cx('wrapper')}>
            <div className={cx('container')}>
                <div className={cx('header')}>
                    <h1>Kho Câu Hỏi Thông Minh</h1>
                    <p>Hệ thống hỗ trợ tạo câu hỏi đa dạng, chuyên nghiệp</p>
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
                        <IoDocumentsOutline size={18} /> Theo đoạn (Bulk)
                    </button>
                    <button
                        className={cx('modeBtn', { active: mode === MODES.BULK_NO_PASSAGE })}
                        onClick={() => setMode(MODES.BULK_NO_PASSAGE)}
                    >
                        <IoListOutline size={18} /> Độc lập (Bulk)
                    </button>
                </div>

                {/* Common Info */}
                <div className={cx('formSection')}>
                    <h3>Thông tin chung</h3>
                    <div className={cx('answerGrid')}>
                        <div className={cx('inputGroup')}>
                            <label>Mã phần thi (Exam Part ID)</label>
                            <input
                                type="number"
                                value={examPartId}
                                onChange={(e) => setExamPartId(e.target.value)}
                                placeholder="Ví dụ: 1"
                            />
                        </div>
                        <div className={cx('inputGroup')}>
                            <label>Lớp (Class ID)</label>
                            <input
                                type="number"
                                value={classId}
                                onChange={(e) => setClassId(e.target.value)}
                                placeholder="Ví dụ: 10"
                            />
                        </div>
                    </div>
                </div>

                {/* Passage Section */}
                {(mode === MODES.SINGLE || mode === MODES.BULK_PASSAGE) && (
                    <div className={cx('formSection')}>
                        <h3>Đoạn văn / Nội dung (Passage)</h3>
                        <div className={cx('inputGroup')}>
                            <label>Loại nội dung</label>
                            <select
                                value={passage.passageType}
                                onChange={(e) => setPassage({ ...passage, passageType: e.target.value })}
                            >
                                <option value="READING">Đọc hiểu (Reading)</option>
                                <option value="LISTENING">Nghe (Listening)</option>
                            </select>
                        </div>
                        {passage.passageType === 'READING' ? (
                            <div className={cx('inputGroup')}>
                                <label>Nội dung đoạn văn</label>
                                <textarea
                                    value={passage.content}
                                    onChange={(e) => setPassage({ ...passage, content: e.target.value })}
                                    placeholder="Nhập nội dung đoạn văn..."
                                />
                            </div>
                        ) : (
                            <div className={cx('inputGroup')}>
                                <label>File âm thanh (Audio)</label>
                                <input
                                    type="file"
                                    accept="audio/*"
                                    onChange={(e) => setAudioFile(e.target.files[0])}
                                />
                            </div>
                        )}
                        <div className={cx('inputGroup')}>
                            <label>Media URL (Nếu có)</label>
                            <input
                                type="text"
                                value={passage.mediaUrl}
                                onChange={(e) => setPassage({ ...passage, mediaUrl: e.target.value })}
                                placeholder="https://..."
                            />
                        </div>
                    </div>
                )}

                {/* Questions Section */}
                <div className={cx('formSection')}>
                    <h3>Danh sách câu hỏi</h3>
                    {questions.map((q, qIndex) => (
                        <div key={qIndex} className={cx('questionItem')}>
                            {questions.length > 1 && (
                                <button className={cx('removeBtn')} onClick={() => handleRemoveQuestion(qIndex)}>
                                    <IoTrashOutline size={20} />
                                </button>
                            )}
                            <div className={cx('inputGroup')}>
                                <label>Câu hỏi {qIndex + 1}</label>
                                <input
                                    type="text"
                                    value={q.questionText}
                                    onChange={(e) => handleQuestionChange(qIndex, 'questionText', e.target.value)}
                                    placeholder="Nhập nội dung câu hỏi..."
                                />
                            </div>
                            <div className={cx('answerGrid')}>
                                {q.answers.map((a, aIndex) => (
                                    <div key={aIndex} className={cx('answerItem', { correct: a.isCorrect })}>
                                        <input
                                            type="checkbox"
                                            className={cx('checkbox')}
                                            checked={a.isCorrect}
                                            onChange={(e) => handleAnswerChange(qIndex, aIndex, 'isCorrect', e.target.checked)}
                                        />
                                        <input
                                            type="text"
                                            value={a.content}
                                            onChange={(e) => handleAnswerChange(qIndex, aIndex, 'content', e.target.value)}
                                            placeholder={`Đáp án ${String.fromCharCode(65 + aIndex)}`}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}

                    {(mode !== MODES.SINGLE) && (
                        <button className={cx('btnSecondary')} onClick={handleAddQuestion} style={{ width: '100%', marginTop: '12px' }}>
                            <IoAddOutline size={20} /> Thêm câu hỏi
                        </button>
                    )}
                </div>

                <div className={cx('btnActions')}>
                    <button className={cx('btnPrimary')} onClick={handleSubmit}>
                        <IoCloudUploadOutline size={22} /> Lưu vào kho câu hỏi
                    </button>
                </div>
            </div>
        </div>
    );
};

export default QuestionBankCreator;
