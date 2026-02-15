import React, { useState, useEffect } from 'react';
import { Row, Col, Spinner, Alert, Button } from 'react-bootstrap';
import axios from 'axios';
import {
  IoSettingsOutline,
  IoLayersOutline,
  IoCalendarOutline,
  IoTimeOutline,
  IoImageOutline,
  IoInformationCircleOutline,
  IoSchoolOutline,
  IoBookOutline,
  IoRocketOutline,
  IoMusicalNotesOutline,
  IoAddOutline,
} from 'react-icons/io5';
import { Trash, PlusCircle } from 'lucide-react';
import classNames from 'classnames/bind';
import { toast } from 'react-toastify';
import { useCreateTest, CREATOR_TYPES } from '~/hook/useCreateTest';
import styles from '../modals/CreateTestModal.module.scss';

const cx = classNames.bind(styles);

const ACCEPT_BY_TYPE = {
  LISTENING: 'audio/*',
  READING: 'image/*',
  DOCUMENT: '.pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document',
};

const CreateTestFormBody = ({
  mode = 'personal',
  classId,
  chapterId,
  creatorType: creatorTypeProp = CREATOR_TYPES.TEST,
  onCreatorTypeChange,
  onSuccess,
  onCancel,
  embedded = false,
  showCreatorTypeTabs = true,
}) => {
  const [creatorTypeLocal, setCreatorTypeLocal] = useState(creatorTypeProp);
  const isControlled = typeof onCreatorTypeChange === 'function';
  const activeCreatorType = isControlled ? creatorTypeProp : creatorTypeLocal;
  const setCreatorType = isControlled ? (v) => onCreatorTypeChange(v) : setCreatorTypeLocal;

  const {
    examTypes,
    examParts,
    testInfo,
    setTestInfo,
    questions,
    groups,
    loading,
    notification,
    handleExamTypeChange,
    addQuestion,
    removeQuestion,
    updateQuestionText,
    updateAnswer,
    addMediaFiles,
    removeMediaFile,
    setPassageType,
    addGroup,
    removeGroup,
    updatePassage,
    addGroupMediaFiles,
    removeGroupMediaFile,
    addGroupQuestion,
    removeGroupQuestion,
    updateGroupQuestion,
    updateGroupAnswer,
    setGroupPassageType,
    handleSubmit,
  } = useCreateTest({ mode, classId, chapterId, creatorType: activeCreatorType });

  const [className, setClassName] = useState('');
  const [chapterName, setChapterName] = useState('');

  useEffect(() => {
    if (mode === 'class' && classId) {
      axios.get(`/api/classes/${classId}`).then((res) => setClassName(res.data?.className || `Lớp ${classId}`)).catch(() => setClassName(`Lớp ${classId}`));
    }
    if (mode === 'class' && chapterId) {
      axios.get(`/api/chapters/${chapterId}`).then((res) => setChapterName(res.data?.title || `Chapter ${chapterId}`)).catch(() => setChapterName(`Chapter ${chapterId}`));
    }
  }, [mode, classId, chapterId]);

  const handleFormSubmit = async () => {
    const success = await handleSubmit();
    if (success) {
      if (embedded) toast.success(activeCreatorType === CREATOR_TYPES.TEST ? 'Đã tạo đề thi thành công! 🚀' : 'Đã lưu thành công!');
      onSuccess?.();
    }
  };

  const renderQuestionBlock = (q, i, removeQuestionFn, updateQuestionTextFn, updateAnswerFn, addMediaFilesFn, removeMediaFileFn, setPassageTypeFn, withMedia = true, minQuestions = 1) => (
    <div key={i} className={cx('partBlock')}>
      <div className="d-flex justify-content-between align-items-center mb-2">
        <b>Câu hỏi số {i + 1}</b>
        <Button variant="link" className="text-danger p-0" onClick={() => removeQuestionFn(i)} disabled={minQuestions <= 1}>
          <Trash size={18} />
        </Button>
      </div>
      <input
        className={cx('inputModern', 'mb-3')}
        placeholder="Nhập nội dung câu hỏi..."
        value={q.questionText}
        onChange={(e) => updateQuestionTextFn(i, e.target.value)}
      />
      {withMedia && (
        <div className="mb-3">
          <label className="fw-bold mb-1 d-block">Phương tiện (nếu có)</label>
          <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
            <select className={cx('inputModern')} style={{ width: 'auto' }} value={q.passageType || 'LISTENING'} onChange={(e) => setPassageTypeFn(i, e.target.value)} aria-label="Loại phương tiện">
              <option value="LISTENING">Nghe (audio)</option>
              <option value="READING">Đọc (ảnh)</option>
              <option value="DOCUMENT">Tài liệu (PDF/DOCX)</option>
            </select>
            <input type="file" multiple accept={ACCEPT_BY_TYPE[q.passageType] || ACCEPT_BY_TYPE.READING} className={cx('inputModern')} style={{ width: 'auto' }} onChange={(e) => { addMediaFilesFn(i, e.target.files); e.target.value = ''; }} aria-label="Thêm file" />
          </div>
          {q.mediaFiles?.length > 0 && (
            <ul className="list-unstyled mb-0 mt-2">
              {q.mediaFiles.map((file, fIdx) => (
                <li key={fIdx} className="d-flex align-items-center gap-2 mb-1">
                  <span className="small text-secondary">{file.name}</span>
                  <button type="button" className="btn btn-sm btn-outline-danger p-0 px-1" onClick={() => removeMediaFileFn(i, fIdx)} aria-label={`Xóa ${file.name}`}><Trash size={14} /></button>
                  {q.passageType === 'LISTENING' && file.type.startsWith('audio/') && <audio controls className="flex-grow-1" style={{ maxHeight: 32 }}><source src={URL.createObjectURL(file)} /></audio>}
                  {q.passageType === 'READING' && file.type.startsWith('image/') && <img src={URL.createObjectURL(file)} alt={file.name} style={{ maxHeight: 40, objectFit: 'contain' }} />}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      <Row className="g-2">
        {q.answers.map((ans, aIndex) => (
          <Col md={6} key={aIndex}>
            <div className={cx('answerItem')}>
              <input type="radio" name={`q-${i}`} checked={ans.isCorrect} onChange={() => updateAnswerFn(i, aIndex, 'isCorrect', true)} />
              <span className="ms-2 fw-bold">{ans.answerLabel}.</span>
              <input className={cx('inputModern', 'ms-2')} value={ans.answerText} placeholder={`Đáp án ${ans.answerLabel}`} onChange={(e) => updateAnswerFn(i, aIndex, 'answerText', e.target.value)} />
            </div>
          </Col>
        ))}
      </Row>
    </div>
  );

  return (
    <div className={cx('body')}>
      {notification.message && (
        <Alert variant={notification.type} className="mb-3">{notification.message}</Alert>
      )}

      {showCreatorTypeTabs && (
        <div className={cx('creatorTypeTabs')}>
          <button type="button" className={cx('creatorTypeTab', { active: activeCreatorType === CREATOR_TYPES.TEST })} onClick={() => setCreatorType(CREATOR_TYPES.TEST)}>
            <IoRocketOutline size={20} /> Tạo đề thi
          </button>
          <button type="button" className={cx('creatorTypeTab', { active: activeCreatorType === CREATOR_TYPES.BULK })} onClick={() => setCreatorType(CREATOR_TYPES.BULK)}>
            <IoMusicalNotesOutline size={20} /> Tạo câu hỏi bulk
          </button>
          <button type="button" className={cx('creatorTypeTab', { active: activeCreatorType === CREATOR_TYPES.PASSAGE })} onClick={() => setCreatorType(CREATOR_TYPES.PASSAGE)}>
            <IoLayersOutline size={20} /> Tạo nhóm passage
          </button>
        </div>
      )}

      <div className={cx('configCard')}>
        <div className={cx('sectionTitle')}>
          <IoSettingsOutline /> 1. {activeCreatorType === CREATOR_TYPES.TEST ? 'Cấu hình bài thi' : 'Thông tin chung'}
        </div>
        <Row className="g-3">
          {mode === 'class' && (
            <>
              <Col md={6}>
                <div className={cx('formGroupModern')}>
                  <label><IoSchoolOutline /> Lớp học</label>
                  <input className={cx('inputModern', 'inputDisabled')} value={className} disabled />
                </div>
              </Col>
              <Col md={6}>
                <div className={cx('formGroupModern')}>
                  <label><IoBookOutline /> Chương</label>
                  <input className={cx('inputModern', 'inputDisabled')} value={chapterName} disabled />
                </div>
              </Col>
            </>
          )}
          {activeCreatorType === CREATOR_TYPES.TEST && (
            <>
              <Col md={8}>
                <div className={cx('formGroupModern')}>
                  <label>Tiêu đề đề thi</label>
                  <input className={cx('inputModern')} value={testInfo.title} onChange={(e) => setTestInfo({ ...testInfo, title: e.target.value })} />
                </div>
              </Col>
              <Col md={4}>
                <div className={cx('formGroupModern')}>
                  <label><IoImageOutline /> Link ảnh Banner</label>
                  <input className={cx('inputModern')} value={testInfo.bannerUrl} onChange={(e) => setTestInfo({ ...testInfo, bannerUrl: e.target.value })} />
                </div>
              </Col>
            </>
          )}
          <Col md={activeCreatorType === CREATOR_TYPES.TEST ? 3 : 4}>
            <div className={cx('formGroupModern')}>
              <label>Loại kỳ thi</label>
              <select className={cx('inputModern')} value={testInfo.examTypeId} onChange={(e) => handleExamTypeChange(e.target.value)}>
                <option value="">-- Chọn --</option>
                {examTypes.map((t) => <option key={t.examTypeId} value={t.examTypeId}>{t.name}</option>)}
              </select>
            </div>
          </Col>
          <Col md={activeCreatorType === CREATOR_TYPES.TEST ? 3 : 4}>
            <div className={cx('formGroupModern')}>
              <label>Phần thi *</label>
              <select className={cx('inputModern')} value={testInfo.examPartId} onChange={(e) => setTestInfo({ ...testInfo, examPartId: e.target.value })} disabled={!testInfo.examTypeId}>
                <option value="">-- Chọn part --</option>
                {examParts.map((p) => <option key={p.examPartId} value={p.examPartId}>{p.name}</option>)}
              </select>
            </div>
          </Col>
          {activeCreatorType === CREATOR_TYPES.TEST && (
            <>
              <Col md={3}>
                <div className={cx('formGroupModern')}>
                  <label><IoTimeOutline /> Thời gian (phút)</label>
                  <input type="number" className={cx('inputModern')} value={testInfo.durationMinutes} onChange={(e) => setTestInfo({ ...testInfo, durationMinutes: e.target.value })} />
                </div>
              </Col>
              <Col md={3}>
                <div className={cx('formGroupModern')}>
                  <label><IoRocketOutline /> Lượt làm tối đa</label>
                  <input type="number" className={cx('inputModern')} value={testInfo.maxAttempts} onChange={(e) => setTestInfo({ ...testInfo, maxAttempts: e.target.value })} />
                </div>
              </Col>
              <Col md={6}>
                <div className={cx('formGroupModern')}>
                  <label><IoCalendarOutline /> Thời gian bắt đầu</label>
                  <input type="datetime-local" className={cx('inputModern')} value={testInfo.availableFrom} onChange={(e) => setTestInfo({ ...testInfo, availableFrom: e.target.value })} />
                </div>
              </Col>
              <Col md={6}>
                <div className={cx('formGroupModern')}>
                  <label><IoCalendarOutline /> Thời gian kết thúc</label>
                  <input type="datetime-local" className={cx('inputModern')} value={testInfo.availableTo} onChange={(e) => setTestInfo({ ...testInfo, availableTo: e.target.value })} />
                </div>
              </Col>
              <Col md={12}>
                <div className={cx('formGroupModern')}>
                  <label><IoInformationCircleOutline /> Mô tả</label>
                  <textarea className={cx('inputModern')} rows={2} value={testInfo.description} onChange={(e) => setTestInfo({ ...testInfo, description: e.target.value })} />
                </div>
              </Col>
            </>
          )}
        </Row>
      </div>

      {(activeCreatorType === CREATOR_TYPES.TEST || activeCreatorType === CREATOR_TYPES.BULK) && (
        <>
          <div className={cx('sectionTitle')}>
            <IoLayersOutline /> 2. Danh sách câu hỏi ({questions.length})
          </div>
          {questions.map((q, i) => renderQuestionBlock(q, i, removeQuestion, updateQuestionText, updateAnswer, addMediaFiles, removeMediaFile, setPassageType, true, questions.length))}
        </>
      )}

      {activeCreatorType === CREATOR_TYPES.PASSAGE && (
        <>
          <div className={cx('sectionTitle')}>
            <IoLayersOutline /> 2. Danh sách nhóm ({groups.length})
          </div>
          {groups.map((group, gIndex) => (
            <div key={gIndex} className={cx('groupCard')}>
              <div className={cx('groupHeader')}>
                <h4 className={cx('groupTitle')}>Nhóm thứ {gIndex + 1}</h4>
                {groups.length > 1 && (
                  <Button variant="link" className={cx('removeBtn')} onClick={() => removeGroup(gIndex)} aria-label={`Xóa nhóm ${gIndex + 1}`}>
                    <Trash size={18} />
                  </Button>
                )}
              </div>
              <div className={cx('passageSection')}>
                <div className={cx('formGroupModern')}>
                  <label>Nội dung Passage (tùy chọn)</label>
                  <textarea className={cx('inputModern')} rows={2} value={group.passage.content} onChange={(e) => updatePassage(gIndex, 'content', e.target.value)} placeholder="Nhập nội dung văn bản nếu có..." />
                </div>
                <div className={cx('formGroupModern')}>
                  <label>Phương tiện</label>
                  <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
                    <select className={cx('inputModern')} style={{ width: 'auto' }} value={group.passage.passageType} onChange={(e) => setGroupPassageType(gIndex, e.target.value)}>
                      <option value="LISTENING">Nghe (audio)</option>
                      <option value="READING">Đọc (ảnh)</option>
                      <option value="DOCUMENT">Tài liệu (PDF/DOCX)</option>
                    </select>
                    <input type="file" multiple accept={ACCEPT_BY_TYPE[group.passage.passageType] || ACCEPT_BY_TYPE.READING} className={cx('inputModern')} style={{ width: 'auto' }} onChange={(e) => { addGroupMediaFiles(gIndex, e.target.files); e.target.value = ''; }} />
                  </div>
                  {group.passage.mediaFiles?.length > 0 && (
                    <ul className="list-unstyled mb-0 mt-2">
                      {group.passage.mediaFiles.map((file, fIdx) => (
                        <li key={fIdx} className="d-flex align-items-center gap-2 mb-1">
                          <span className="small text-secondary">{file.name}</span>
                          <button type="button" className="btn btn-sm btn-outline-danger p-0 px-1" onClick={() => removeGroupMediaFile(gIndex, fIdx)}><Trash size={14} /></button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
              <div className={cx('questionsSection')}>
                {group.questions.map((q, qIndex) => renderQuestionBlock(
                  q,
                  qIndex,
                  (i) => removeGroupQuestion(gIndex, i),
                  (i, v) => updateGroupQuestion(gIndex, i, 'questionText', v),
                  (i, aIndex, field, value) => updateGroupAnswer(gIndex, i, aIndex, field, value),
                  () => {},
                  () => {},
                  () => {},
                  false,
                  group.questions.length
                ))}
                <button type="button" className={cx('btnSecondary')} onClick={() => addGroupQuestion(gIndex)}><PlusCircle size={18} /> Thêm câu hỏi</button>
              </div>
            </div>
          ))}
          <button type="button" className={cx('btnSecondary', 'btnGroupAdd')} onClick={addGroup}><IoAddOutline size={20} /> Thêm nhóm passage</button>
        </>
      )}

      {(activeCreatorType === CREATOR_TYPES.TEST || activeCreatorType === CREATOR_TYPES.BULK) && (
        <div className={cx('footer')}>
          <button type="button" className={cx('btnAdd')} onClick={addQuestion}><PlusCircle size={18} /> Thêm câu hỏi</button>
          {onCancel && <button type="button" className={cx('btnCancel')} onClick={onCancel}>Để sau</button>}
          <button type="button" className={cx('btnSubmit')} onClick={handleFormSubmit} disabled={loading}>
            {loading ? <Spinner size="sm" /> : <><IoRocketOutline /> Lưu & Xuất bản</>}
          </button>
        </div>
      )}

      {activeCreatorType === CREATOR_TYPES.PASSAGE && (
        <div className={cx('footer')}>
          {onCancel && <button type="button" className={cx('btnCancel')} onClick={onCancel}>Để sau</button>}
          <button type="button" className={cx('btnSubmit')} onClick={handleFormSubmit} disabled={loading}>
            {loading ? <Spinner size="sm" /> : <><IoRocketOutline /> Lưu tất cả</>}
          </button>
        </div>
      )}
    </div>
  );
};

export default CreateTestFormBody;
