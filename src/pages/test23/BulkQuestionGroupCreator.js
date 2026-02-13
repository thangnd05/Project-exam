import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Row, Col, Spinner, Button } from 'react-bootstrap';
import classNames from 'classnames/bind';
import { toast } from 'react-toastify';
import {
  IoLayersOutline,
  IoSettingsOutline,
  IoSchoolOutline,
  IoBookOutline,
  IoCheckmarkCircleOutline,
  IoTrashOutline,
  IoAddOutline,
  IoImageOutline,
  IoMusicalNotesOutline,
  IoDocumentOutline,
} from 'react-icons/io5';
import { Trash, PlusCircle } from 'lucide-react';

import styles from './BulkQuestionGroupCreator.module.scss';

const cx = classNames.bind(styles);

const INITIAL_ANSWER = {
  answerText: '',
  isCorrect: false,
};

const createInitialQuestion = () => ({
  questionText: '',
  questionType: 'MCQ',
  answers: [
    { answerLabel: 'A', ...INITIAL_ANSWER },
    { answerLabel: 'B', ...INITIAL_ANSWER },
    { answerLabel: 'C', ...INITIAL_ANSWER },
    { answerLabel: 'D', ...INITIAL_ANSWER },
  ],
});

const createInitialGroup = () => ({
  passage: {
    content: '',
    passageType: 'READING',
    mediaFiles: [],
  },
  questions: [createInitialQuestion()],
});

const ACCEPT_BY_TYPE = {
  LISTENING: 'audio/*',
  READING: 'image/*',
  DOCUMENT: '.pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document',
};

const BulkQuestionGroupCreator = () => {
  const [examTypes, setExamTypes] = useState([]);
  const [examParts, setExamParts] = useState([]);
  const [classes, setClasses] = useState([]);

  const [examTypeId, setExamTypeId] = useState('');
  const [examPartId, setExamPartId] = useState('');
  const [classId, setClassId] = useState('');
  const [chapterId, setChapterId] = useState('');

  const [groups, setGroups] = useState([createInitialGroup()]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    axios.get('/api/exam-types').then((res) => setExamTypes(res.data || []));
    axios.get('/api/classes/my').then((res) => {
      const data = Array.isArray(res.data) ? res.data : res.data?.classes || [];
      setClasses(data);
    });
  }, []);

  useEffect(() => {
    if (!examTypeId) {
      setExamParts([]);
      setExamPartId('');
      return;
    }
    axios.get(`/api/exam-parts/by-exam-type/${examTypeId}`).then((res) => setExamParts(res.data || []));
  }, [examTypeId]);

  const handleAddGroup = () => setGroups([...groups, createInitialGroup()]);

  const handleRemoveGroup = (gIndex) => {
    if (groups.length > 1) setGroups(groups.filter((_, i) => i !== gIndex));
  };

  const handlePassageChange = (gIndex, field, value) => {
    const newGroups = [...groups];
    const prev = newGroups[gIndex].passage;
    newGroups[gIndex].passage = { ...prev, [field]: value };
    if (field === 'passageType') {
      newGroups[gIndex].passage.mediaFiles = [];
    }
    setGroups(newGroups);
  };

  const handleAddMediaFiles = (gIndex, fileList) => {
    const files = fileList ? Array.from(fileList) : [];
    if (files.length === 0) return;
    const newGroups = [...groups];
    const prev = newGroups[gIndex].passage.mediaFiles || [];
    newGroups[gIndex].passage = { ...newGroups[gIndex].passage, mediaFiles: [...prev, ...files] };
    setGroups(newGroups);
  };

  const handleRemoveMediaFile = (gIndex, fIndex) => {
    const newGroups = [...groups];
    newGroups[gIndex].passage.mediaFiles = newGroups[gIndex].passage.mediaFiles.filter((_, i) => i !== fIndex);
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
    newGroups[gIndex].questions[qIndex] = { ...newGroups[gIndex].questions[qIndex], [field]: value };
    setGroups(newGroups);
  };

  const handleAnswerChange = (gIndex, qIndex, aIndex, field, value) => {
    const newGroups = [...groups];
    const question = newGroups[gIndex].questions[qIndex];
    if (field === 'isCorrect') {
      question.answers = question.answers.map((a, i) => ({ ...a, isCorrect: i === aIndex }));
    } else {
      question.answers[aIndex] = { ...question.answers[aIndex], [field]: value };
    }
    setGroups(newGroups);
  };

  const handleSubmit = async () => {
    if (!examPartId) {
      toast.warn('Vui lòng chọn Phần thi (Part)');
      return;
    }

    setLoading(true);
    try {
      const requestData = {
        examPartId: Number(examPartId),
        classId: classId ? Number(classId) : null,
        chapterId: chapterId ? Number(chapterId) : null,
        groups: groups.map((group) => ({
          passage: {
            passageType: group.passage.passageType,
            content: group.passage.content,
          },
          questions: group.questions.map((q) => ({
            questionText: q.questionText,
            questionType: q.questionType,
            answers: q.answers.map((a) => ({
              answerLabel: a.answerLabel,
              answerText: a.answerText,
              isCorrect: a.isCorrect,
            })),
          })),
        })),
      };

      const formData = new FormData();
      formData.append('request', JSON.stringify(requestData));

      groups.forEach((group, gIndex) => {
        if (group.passage.mediaFiles?.length > 0) {
          group.passage.mediaFiles.forEach((file, fIndex) => {
            formData.append(`media_${gIndex}_${fIndex}`, file);
          });
        }
      });

      await axios.post('/api/questions/bulk-groups', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success('🎉 Đã lưu thành công!');
      setGroups([createInitialGroup()]);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={cx('wrapper')}>
      <div className={cx('container')}>
        <div className={cx('header')}>
          <h1 className={cx('title')}>
            <IoLayersOutline /> Bulk Passage Group Creator
          </h1>
          <p className={cx('subtitle')}>Tạo nhiều nhóm câu hỏi và upload đa phương tiện</p>
        </div>

        {/* 1. Thông tin chung */}
        <div className={cx('configCard')}>
          <div className={cx('sectionTitle')}>
            <IoSettingsOutline /> 1. Thông tin chung
          </div>
          <Row className="g-3">
            <Col md={4}>
              <div className={cx('formGroupModern')}>
                <label><IoSchoolOutline /> Loại kỳ thi</label>
                <select
                  className={cx('inputModern')}
                  value={examTypeId}
                  onChange={(e) => setExamTypeId(e.target.value)}
                  aria-label="Loại kỳ thi"
                >
                  <option value="">-- Chọn kỳ thi --</option>
                  {examTypes.map((et) => (
                    <option key={et.examTypeId} value={et.examTypeId}>{et.name}</option>
                  ))}
                </select>
              </div>
            </Col>
            <Col md={4}>
              <div className={cx('formGroupModern')}>
                <label><IoBookOutline /> Phần thi *</label>
                <select
                  className={cx('inputModern')}
                  value={examPartId}
                  onChange={(e) => setExamPartId(e.target.value)}
                  disabled={!examTypeId}
                  aria-label="Phần thi"
                >
                  <option value="">-- Chọn Part --</option>
                  {examParts.map((p) => (
                    <option key={p.examPartId} value={p.examPartId}>{p.name}</option>
                  ))}
                </select>
              </div>
            </Col>
            <Col md={4}>
              <div className={cx('formGroupModern')}>
                <label><IoSchoolOutline /> Lớp học</label>
                <select
                  className={cx('inputModern')}
                  value={classId}
                  onChange={(e) => setClassId(e.target.value)}
                  aria-label="Lớp học"
                >
                  <option value="">-- Không chọn --</option>
                  {classes.map((c) => (
                    <option key={c.classId} value={c.classId}>{c.className}</option>
                  ))}
                </select>
              </div>
            </Col>
          </Row>
        </div>

        {/* 2. Danh sách nhóm */}
        <div className={cx('sectionTitle')}>
          <IoLayersOutline /> 2. Danh sách nhóm ({groups.length})
        </div>

        {groups.map((group, gIndex) => (
          <div key={gIndex} className={cx('groupCard')}>
            <div className={cx('groupHeader')}>
              <h4 className={cx('groupTitle')}>Nhóm thứ {gIndex + 1}</h4>
              {groups.length > 1 && (
                <Button
                  variant="link"
                  className={cx('removeBtn')}
                  onClick={() => handleRemoveGroup(gIndex)}
                  aria-label={`Xóa nhóm ${gIndex + 1}`}
                >
                  <Trash size={18} />
                </Button>
              )}
            </div>

            {/* Passage */}
            <div className={cx('passageSection')}>
              <Row className="g-3">
                <Col md={12}>
                  <div className={cx('formGroupModern')}>
                    <label>Nội dung Passage (tùy chọn)</label>
                    <textarea
                      className={cx('inputModern')}
                      rows={3}
                      value={group.passage.content}
                      onChange={(e) => handlePassageChange(gIndex, 'content', e.target.value)}
                      placeholder="Nhập nội dung văn bản nếu có..."
                    />
                  </div>
                </Col>
                <Col md={12}>
                  <div className={cx('formGroupModern')}>
                    <label>Phương tiện (nếu có)</label>
                    <div className={cx('mediaRow')}>
                      <select
                        className={cx('inputModern', 'selectType')}
                        value={group.passage.passageType}
                        onChange={(e) => handlePassageChange(gIndex, 'passageType', e.target.value)}
                        aria-label="Loại phương tiện"
                      >
                        <option value="LISTENING">Nghe (audio)</option>
                        <option value="READING">Đọc (ảnh)</option>
                        <option value="DOCUMENT">Tài liệu (PDF/DOCX)</option>
                      </select>
                      <input
                        key={`file-${gIndex}-${group.passage.passageType}`}
                        type="file"
                        multiple
                        accept={ACCEPT_BY_TYPE[group.passage.passageType] || ACCEPT_BY_TYPE.READING}
                        className={cx('inputModern', 'fileInput')}
                        onChange={(e) => {
                          handleAddMediaFiles(gIndex, e.target.files);
                          e.target.value = '';
                        }}
                        aria-label="Chọn file"
                      />
                      <span className={cx('acceptHint')}>
                        {group.passage.passageType === 'LISTENING' && 'Chỉ file âm thanh'}
                        {group.passage.passageType === 'READING' && 'Chỉ file ảnh'}
                        {group.passage.passageType === 'DOCUMENT' && 'Chỉ PDF, DOC, DOCX'}
                      </span>
                    </div>
                    {group.passage.mediaFiles?.length > 0 && (
                      <ul className={cx('mediaList')}>
                        {group.passage.mediaFiles.map((file, fIndex) => (
                          <li key={fIndex} className={cx('mediaItem')}>
                            {group.passage.passageType === 'LISTENING' && file.type.startsWith('audio/') && (
                              <IoMusicalNotesOutline size={24} className={cx('mediaIcon')} />
                            )}
                            {group.passage.passageType === 'READING' && file.type.startsWith('image/') && (
                              <img src={URL.createObjectURL(file)} alt={file.name} className={cx('mediaThumb')} />
                            )}
                            {(group.passage.passageType === 'DOCUMENT' || (!file.type.startsWith('audio/') && !file.type.startsWith('image/'))) && (
                              <IoDocumentOutline size={24} className={cx('mediaIcon')} />
                            )}
                            <span className={cx('mediaName')}>{file.name}</span>
                            {group.passage.passageType === 'DOCUMENT' && (
                              <span className={cx('mediaBadge')}>(PDF/DOCX)</span>
                            )}
                            <button
                              type="button"
                              className={cx('removeMediaBtn')}
                              onClick={() => handleRemoveMediaFile(gIndex, fIndex)}
                              aria-label={`Xóa ${file.name}`}
                            >
                              <Trash size={14} />
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </Col>
              </Row>
            </div>

            {/* Questions */}
            <div className={cx('questionsSection')}>
              {group.questions.map((q, qIndex) => (
                <div key={qIndex} className={cx('partBlock')}>
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <b>Câu hỏi số {qIndex + 1}</b>
                    <Button
                      variant="link"
                      className="text-danger p-0"
                      onClick={() => handleRemoveQuestion(gIndex, qIndex)}
                      disabled={group.questions.length === 1}
                      aria-label={`Xóa câu ${qIndex + 1}`}
                    >
                      <Trash size={18} />
                    </Button>
                  </div>

                  <input
                    className={cx('inputModern', 'mb-3')}
                    placeholder="Nhập nội dung câu hỏi..."
                    value={q.questionText}
                    onChange={(e) => handleQuestionChange(gIndex, qIndex, 'questionText', e.target.value)}
                  />

                  <Row className="g-2">
                    {q.answers.map((a, aIndex) => (
                      <Col md={6} key={aIndex}>
                        <div className={cx('answerItem', { correct: a.isCorrect })}>
                          <input
                            type="radio"
                            name={`q-${gIndex}-${qIndex}`}
                            checked={a.isCorrect}
                            onChange={() => handleAnswerChange(gIndex, qIndex, aIndex, 'isCorrect', true)}
                            aria-label={`Đáp án ${a.answerLabel}`}
                          />
                          <span className={cx('answerLabel')}>{a.answerLabel}.</span>
                          <input
                            type="text"
                            className={cx('answerInput')}
                            value={a.answerText}
                            placeholder={`Đáp án ${a.answerLabel}`}
                            onChange={(e) => handleAnswerChange(gIndex, qIndex, aIndex, 'answerText', e.target.value)}
                          />
                        </div>
                      </Col>
                    ))}
                  </Row>
                </div>
              ))}
              <button type="button" className={cx('btnSecondary')} onClick={() => handleAddQuestion(gIndex)}>
                <PlusCircle size={18} /> Thêm câu hỏi
              </button>
            </div>
          </div>
        ))}

        <button type="button" className={cx('btnSecondary', 'btnGroupAdd')} onClick={handleAddGroup}>
          <IoAddOutline size={20} /> Thêm nhóm passage mới
        </button>

        <div className={cx('footer')}>
          <button type="button" className={cx('btnPrimary')} onClick={handleSubmit} disabled={loading}>
            {loading ? <Spinner animation="border" size="sm" /> : <IoCheckmarkCircleOutline size={22} />}
            {loading ? 'Đang lưu...' : 'Lưu tất cả câu hỏi'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkQuestionGroupCreator;
