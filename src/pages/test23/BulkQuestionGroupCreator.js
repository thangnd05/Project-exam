import React, { useState, useEffect } from 'react';
import axios from 'axios';
import classNames from 'classnames/bind';
import { toast } from 'react-toastify';
import {
    IoAddOutline,
    IoTrashOutline,
    IoBookOutline,
    IoSchoolOutline,
    IoLayersOutline,
    IoCheckmarkCircleOutline,
    IoMusicalNotesOutline,
} from 'react-icons/io5';

import styles from './BulkQuestionGroupCreator.module.scss';

const cx = classNames.bind(styles);

const INITIAL_ANSWER = {
    answerText: '',
    isCorrect: false
};

const createInitialQuestion = () => ({
    questionText: '',
    questionType: 'MCQ',
    answers: [
        { answerLabel: 'A', ...INITIAL_ANSWER },
        { answerLabel: 'B', ...INITIAL_ANSWER },
        { answerLabel: 'C', ...INITIAL_ANSWER },
        { answerLabel: 'D', ...INITIAL_ANSWER }
    ]
});

const createInitialGroup = () => ({
    passage: {
        content: '',
        passageType: 'READING',
        mediaUrl: '',
        audioFile: null
    },
    questions: [createInitialQuestion()]
});

const BulkQuestionGroupCreator = () => {
    const [examTypes, setExamTypes] = useState([]);
    const [examParts, setExamParts] = useState([]);
    const [classes, setClasses] = useState([]);

    const [examTypeId, setExamTypeId] = useState('');
    const [examPartId, setExamPartId] = useState('');
    const [classId, setClassId] = useState('');
    const [chapterId, setChapterId] = useState('');

    const [groups, setGroups] = useState([createInitialGroup()]);

    useEffect(() => {
        axios.get('/api/exam-types').then(res => setExamTypes(res.data || []));
        axios.get('/api/classes/my')
            .then(res => setClasses(Array.isArray(res.data) ? res.data : (res.data.classes || [])));
    }, []);

    useEffect(() => {
        if (!examTypeId) {
            setExamParts([]);
            return;
        }
        axios.get(`/api/exam-parts/by-exam-type/${examTypeId}`)
            .then(res => setExamParts(res.data || []));
    }, [examTypeId]);

    const handleAddGroup = () => {
        setGroups([...groups, createInitialGroup()]);
    };

    const handleRemoveGroup = (gIndex) => {
        setGroups(groups.filter((_, i) => i !== gIndex));
    };

    const handlePassageChange = (gIndex, field, value) => {
        const newGroups = [...groups];
        newGroups[gIndex].passage[field] = value;
        setGroups(newGroups);
    };

    const handleAddQuestion = (gIndex) => {
        const newGroups = [...groups];
        newGroups[gIndex].questions.push(createInitialQuestion());
        setGroups(newGroups);
    };

    const handleRemoveQuestion = (gIndex, qIndex) => {
        const newGroups = [...groups];
        newGroups[gIndex].questions =
            newGroups[gIndex].questions.filter((_, i) => i !== qIndex);
        setGroups(newGroups);
    };

    const handleQuestionChange = (gIndex, qIndex, field, value) => {
        const newGroups = [...groups];
        newGroups[gIndex].questions[qIndex][field] = value;
        setGroups(newGroups);
    };

    const handleAnswerChange = (gIndex, qIndex, aIndex, field, value) => {
        const newGroups = [...groups];
        const question = newGroups[gIndex].questions[qIndex];

        if (field === 'isCorrect') {
            question.answers.forEach((ans, i) => {
                ans.isCorrect = i === aIndex;
            });
        } else {
            question.answers[aIndex][field] = value;
        }

        setGroups(newGroups);
    };

    const handleSubmit = async () => {
        if (!examPartId) {
            toast.warn('Vui lòng chọn Phần thi (Part)');
            return;
        }

        try {
            const requestData = {
                examPartId: Number(examPartId),
                classId: classId ? Number(classId) : null,
                chapterId: chapterId ? Number(chapterId) : null,
                groups: groups.map(group => ({
                    passage: {
                        passageType: group.passage.passageType,
                        content: group.passage.content,
                        mediaUrl: group.passage.mediaUrl
                    },
                    questions: group.questions.map(q => ({
                        questionText: q.questionText,
                        questionType: q.questionType,
                        answers: q.answers.map(a => ({
                            answerLabel: a.answerLabel,
                            answerText: a.answerText,
                            isCorrect: a.isCorrect
                        }))
                    }))
                }))
            };

            const hasFiles = groups.some(g => g.passage.audioFile);

            if (hasFiles) {
                const formData = new FormData();
                formData.append('request', JSON.stringify(requestData));
                groups.forEach((group, index) => {
                    if (group.passage.audioFile) {
                        formData.append(`audioFiles`, group.passage.audioFile);
                    }
                });

                await axios.post('/api/questions/bulk-groups-with-audio', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            } else {
                await axios.post('/api/questions/bulk-groups', requestData);
            }

            toast.success('🎉 Đã lưu toàn bộ nhóm câu hỏi thành công!');
            setGroups([createInitialGroup()]);

        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Có lỗi xảy ra.');
        }
    };

    return (
        <div className={cx('wrapper')}>
            <div className={cx('container')}>
                <div className={cx('header')}>
                    <h1>Bulk Passage Group Creator</h1>
                    <p>Tạo nhiều nhóm câu hỏi (mối nhóm một passage) trong một lần gửi</p>
                </div>

                {/* Common Info */}
                <div className={cx('formSection')}>
                    <h3><IoSchoolOutline /> Thông tin chung</h3>
                    <div className={cx('grid3')}>
                        <div className={cx('inputGroup')}>
                            <label>Loại kỳ thi</label>
                            <select value={examTypeId} onChange={(e) => setExamTypeId(e.target.value)}>
                                <option value="">-- Chọn kỳ thi --</option>
                                {examTypes.map(et => (
                                    <option key={et.examTypeId} value={et.examTypeId}>
                                        {et.name}
                                    </option>
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
                                <option value="">-- Chọn Part --</option>
                                {examParts.map(p => (
                                    <option key={p.examPartId} value={p.examPartId}>
                                        {p.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className={cx('inputGroup')}>
                            <label>Lớp học (Tuỳ chọn)</label>
                            <select value={classId} onChange={(e) => setClassId(e.target.value)}>
                                <option value="">-- Không chọn lớp --</option>
                                {classes.map(c => (
                                    <option key={c.classId} value={c.classId}>
                                        {c.className}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Groups */}
                {groups.map((group, gIndex) => (
                    <div key={gIndex} className={cx('groupCard')}>
                        <div className={cx('groupHeader')}>
                            <h4><IoLayersOutline /> Nhóm thứ {gIndex + 1}</h4>
                            {groups.length > 1 && (
                                <button className={cx('removeBtn')} onClick={() => handleRemoveGroup(gIndex)}>
                                    <IoTrashOutline size={20} /> Xóa Nhóm
                                </button>
                            )}
                        </div>

                        {/* Passage for each group */}
                        <div className={cx('formSection')} style={{ boxShadow: 'none', border: '1px solid #edeff2' }}>
                            <h3><IoBookOutline /> Passage</h3>
                            <div className={cx('grid3')}>
                                <div className={cx('inputGroup')}>
                                    <label>Loại nội dung</label>
                                    <select
                                        value={group.passage.passageType}
                                        onChange={(e) => handlePassageChange(gIndex, 'passageType', e.target.value)}
                                    >
                                        <option value="READING">Văn bản (Reading)</option>
                                        <option value="LISTENING">Âm thanh (Listening)</option>
                                    </select>
                                </div>
                                <div className={cx('inputGroup')} style={{ gridColumn: 'span 2' }}>
                                    <label>Media URL (Nếu có)</label>
                                    <input
                                        type="text"
                                        placeholder="https://example.com/audio.mp3"
                                        value={group.passage.mediaUrl || ''}
                                        onChange={(e) => handlePassageChange(gIndex, 'mediaUrl', e.target.value)}
                                    />
                                </div>
                            </div>

                            {group.passage.passageType === 'READING' ? (
                                <div className={cx('inputGroup')}>
                                    <label>Nội dung đoạn văn</label>
                                    <textarea
                                        placeholder="Nhập nội dung bài đọc cho nhóm này..."
                                        value={group.passage.content}
                                        onChange={(e) =>
                                            handlePassageChange(gIndex, 'content', e.target.value)
                                        }
                                    />
                                </div>
                            ) : (
                                <div className={cx('inputGroup')}>
                                    <label><IoMusicalNotesOutline /> Tải lên File Audio</label>
                                    <input
                                        type="file"
                                        accept="audio/*"
                                        onChange={(e) => handlePassageChange(gIndex, 'audioFile', e.target.files[0])}
                                    />
                                    {group.passage.audioFile && (
                                        <div style={{ marginTop: '10px' }}>
                                            <audio controls src={URL.createObjectURL(group.passage.audioFile)} style={{ width: '100%' }} />
                                            <p className="text-muted small mt-1">File: {group.passage.audioFile.name}</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className={cx('questionsList')}>
                            {group.questions.map((q, qIndex) => (
                                <div key={qIndex} className={cx('questionItem')}>
                                    {group.questions.length > 1 && (
                                        <button
                                            className={cx('removeBtn')}
                                            style={{ position: 'absolute', top: '10px', right: '10px' }}
                                            onClick={() => handleRemoveQuestion(gIndex, qIndex)}
                                        >
                                            <IoTrashOutline size={18} />
                                        </button>
                                    )}
                                    <div className={cx('inputGroup')}>
                                        <label className="fw-bold">Câu hỏi {qIndex + 1}</label>
                                        <textarea
                                            placeholder="Nhập nội dung câu hỏi..."
                                            rows={2}
                                            value={q.questionText}
                                            onChange={(e) =>
                                                handleQuestionChange(gIndex, qIndex, 'questionText', e.target.value)
                                            }
                                        />
                                    </div>

                                    <div className={cx('answerGrid')}>
                                        {q.answers.map((a, aIndex) => (
                                            <div key={aIndex} className={cx('answerItem', { correct: a.isCorrect })}>
                                                <input
                                                    type="radio"
                                                    name={`q-${gIndex}-${qIndex}`}
                                                    className={cx('checkbox')}
                                                    checked={a.isCorrect}
                                                    onChange={() =>
                                                        handleAnswerChange(gIndex, qIndex, aIndex, 'isCorrect', true)
                                                    }
                                                />
                                                <b>{a.answerLabel || a.label}.</b>
                                                <input
                                                    type="text"
                                                    style={{ border: 'none', background: 'transparent', width: '100%' }}
                                                    value={a.answerText}
                                                    onChange={(e) =>
                                                        handleAnswerChange(
                                                            gIndex,
                                                            qIndex,
                                                            aIndex,
                                                            'answerText',
                                                            e.target.value
                                                        )
                                                    }
                                                    placeholder={`Đáp án ${a.answerLabel || a.label}`}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}

                            <button className={cx('btnSecondary')} onClick={() => handleAddQuestion(gIndex)}>
                                <IoAddOutline size={18} /> Thêm câu hỏi vào nhóm
                            </button>
                        </div>
                    </div>
                ))}

                <button className={cx('btnSecondary', 'btnGroupAdd')} onClick={handleAddGroup}>
                    <IoAddOutline size={20} /> THÊM NHÓM PASSAGE MỚI
                </button>

                <div className={cx('btnActions')}>
                    <button className={cx('btnPrimary')} onClick={handleSubmit}>
                        <IoCheckmarkCircleOutline size={26} />
                        LƯU TẤT CẢ {groups.reduce((acc, g) => acc + g.questions.length, 0)} CÂU HỎI
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BulkQuestionGroupCreator;
