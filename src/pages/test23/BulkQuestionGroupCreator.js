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
        mediaFiles: [] // Đổi thành mảng để chứa nhiều file
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
        axios.get('/api/classes/my').then(res => {
            const data = Array.isArray(res.data) ? res.data : (res.data.classes || []);
            setClasses(data);
        });
    }, []);

    useEffect(() => {
        if (!examTypeId) {
            setExamParts([]);
            setExamPartId('');
            return;
        }
        axios.get(`/api/exam-parts/by-exam-type/${examTypeId}`)
            .then(res => setExamParts(res.data || []));
    }, [examTypeId]);

    const handleAddGroup = () => setGroups([...groups, createInitialGroup()]);

    const handleRemoveGroup = (gIndex) => {
        if (groups.length > 1) setGroups(groups.filter((_, i) => i !== gIndex));
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
        if (newGroups[gIndex].questions.length > 1) {
            newGroups[gIndex].questions = newGroups[gIndex].questions.filter((_, i) => i !== qIndex);
            setGroups(newGroups);
        }
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
            question.answers.forEach((ans, i) => ans.isCorrect = i === aIndex);
        } else {
            question.answers[aIndex][field] = value;
        }
        setGroups(newGroups);
    };

    const handleSubmit = async () => {
        if (!examPartId) return toast.warn('Vui lòng chọn Phần thi (Part)');

        try {
            const requestData = {
                examPartId: Number(examPartId),
                classId: classId ? Number(classId) : null,
                chapterId: chapterId ? Number(chapterId) : null,
                groups: groups.map(group => ({
                    passage: {
                        passageType: group.passage.passageType,
                        content: group.passage.content
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

            const formData = new FormData();
            formData.append('request', JSON.stringify(requestData));

            // Logic gửi ĐA FILE: media_{gIndex}_{fIndex}
            groups.forEach((group, gIndex) => {
                if (group.passage.mediaFiles && group.passage.mediaFiles.length > 0) {
                    group.passage.mediaFiles.forEach((file, fIndex) => {
                        formData.append(`media_${gIndex}_${fIndex}`, file);
                    });
                }
            });

            await axios.post('/api/questions/bulk-groups', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            toast.success('🎉 Đã lưu thành công!');
            setGroups([createInitialGroup()]);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Có lỗi xảy ra.');
        }
    };

    return (
        <div className={cx('wrapper')}>
            <div className={cx('container')}>
                <div className={cx('header')}>
                    <h1>Bulk Passage Group Creator</h1>
                    <p>Tạo nhiều nhóm câu hỏi và upload đa phương tiện</p>
                </div>

                <div className={cx('formSection')}>
                    <h3><IoSchoolOutline /> Thông tin chung</h3>
                    <div className={cx('grid3')}>
                        <div className={cx('inputGroup')}>
                            <label>Loại kỳ thi</label>
                            <select value={examTypeId} onChange={(e) => setExamTypeId(e.target.value)}>
                                <option value="">-- Chọn kỳ thi --</option>
                                {examTypes.map(et => <option key={et.examTypeId} value={et.examTypeId}>{et.name}</option>)}
                            </select>
                        </div>
                        <div className={cx('inputGroup')}>
                            <label>Phần thi *</label>
                            <select value={examPartId} onChange={(e) => setExamPartId(e.target.value)} disabled={!examTypeId}>
                                <option value="">-- Chọn Part --</option>
                                {examParts.map(p => <option key={p.examPartId} value={p.examPartId}>{p.name}</option>)}
                            </select>
                        </div>
                        <div className={cx('inputGroup')}>
                            <label>Lớp học</label>
                            <select value={classId} onChange={(e) => setClassId(e.target.value)}>
                                <option value="">-- Không chọn --</option>
                                {classes.map(c => <option key={c.classId} value={c.classId}>{c.className}</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                {groups.map((group, gIndex) => (
                    <div key={gIndex} className={cx('groupCard')}>
                        <div className={cx('groupHeader')}>
                            <h4><IoLayersOutline /> Nhóm thứ {gIndex + 1}</h4>
                            {groups.length > 1 && (
                                <button className={cx('removeBtn')} onClick={() => handleRemoveGroup(gIndex)}>
                                    <IoTrashOutline size={20} />
                                </button>
                            )}
                        </div>

                        <div className={cx('passageSection')}>
                            <div className={cx('inputGroup')}>
                                <label>Loại nội dung</label>
                                <select value={group.passage.passageType} onChange={(e) => handlePassageChange(gIndex, 'passageType', e.target.value)}>
                                    <option value="READING">Reading (Văn bản / Hình ảnh)</option>
                                    <option value="LISTENING">Listening (Âm thanh)</option>
                                </select>
                            </div>
                            <div className={cx('inputGroup')}>
                                <label>Nội dung Passage</label>
                                <textarea value={group.passage.content} onChange={(e) => handlePassageChange(gIndex, 'content', e.target.value)} />
                            </div>
                            <div className={cx('inputGroup')}>
                                <label>Tải lên Media (Có thể chọn nhiều)</label>
                                <input
                                    type="file"
                                    multiple
                                    accept={group.passage.passageType === 'LISTENING' ? 'audio/*' : 'image/*'}
                                    onChange={(e) => handlePassageChange(gIndex, 'mediaFiles', Array.from(e.target.files))}
                                />
                                <div className={cx('mediaPreviewList')}>
                                    {group.passage.mediaFiles.map((file, fIndex) => (
                                        <div key={fIndex} className={cx('previewItem')}>
                                            {group.passage.passageType === 'LISTENING' ?
                                                <IoMusicalNotesOutline size={30} /> :
                                                <img src={URL.createObjectURL(file)} alt="preview" />}
                                            <span>{file.name}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className={cx('questionsList')}>
                            {group.questions.map((q, qIndex) => (
                                <div key={qIndex} className={cx('questionItem')}>
                                    <div className={cx('qItemHeader')}>
                                        <span>Câu hỏi {qIndex + 1}</span>
                                        {group.questions.length > 1 && (
                                            <button className={cx('removeBtnIcon')} onClick={() => handleRemoveQuestion(gIndex, qIndex)}>
                                                <IoTrashOutline />
                                            </button>
                                        )}
                                    </div>
                                    <textarea value={q.questionText} onChange={(e) => handleQuestionChange(gIndex, qIndex, 'questionText', e.target.value)} />
                                    <div className={cx('answerGrid')}>
                                        {q.answers.map((a, aIndex) => (
                                            <div key={aIndex} className={cx('answerItem', { correct: a.isCorrect })}>
                                                <input type="radio" name={`q-${gIndex}-${qIndex}`} checked={a.isCorrect} onChange={() => handleAnswerChange(gIndex, qIndex, aIndex, 'isCorrect', true)} />
                                                <b>{a.answerLabel}.</b>
                                                <input type="text" value={a.answerText} onChange={(e) => handleAnswerChange(gIndex, qIndex, aIndex, 'answerText', e.target.value)} />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                            <button className={cx('btnSecondary')} onClick={() => handleAddQuestion(gIndex)}>+ Thêm câu hỏi</button>
                        </div>
                    </div>
                ))}

                <button className={cx('btnSecondary', 'btnGroupAdd')} onClick={handleAddGroup}>+ THÊM NHÓM PASSAGE MỚI</button>
                <div className={cx('btnActions')}>
                    <button className={cx('btnPrimary')} onClick={handleSubmit}>
                        <IoCheckmarkCircleOutline size={24} /> LƯU TẤT CẢ CÂU HỎI
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BulkQuestionGroupCreator;