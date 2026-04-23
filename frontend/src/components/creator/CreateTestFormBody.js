import React, { useState, useEffect } from 'react';
import { Row, Col, Alert, Button } from 'react-bootstrap';
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
  IoAddOutline,
} from 'react-icons/io5';
import { Trash, PlusCircle } from 'lucide-react';
import classNames from 'classnames/bind';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { useCreateTest, CREATOR_TYPES } from '~/hook/useCreateTest';
import QuestionBlock from './QuestionBlock';
import CreatorTabs from './CreatorTabs';
import FormFooter from './FormFooter';
import CreateFromBankBody from './CreateFromBankBody';
import routes from '~/config/Routes';
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
  const navigate = useNavigate();
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
    setQuestions,
    groups,
    documentFile,
    setDocumentFile,
    loading,
    notification,
    handleExamTypeChange,
    addQuestion,
    removeQuestion,
    updateQuestionText,
    updateQuestionField,
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

  const handleDocumentFileChange = (event) => {
    const selectedFile = event.target.files?.[0] || null;
    setDocumentFile(selectedFile);
    if (selectedFile) {
      handlePreviewQuestionsFromDocument(selectedFile);
    }
  };

  const handlePreviewQuestionsFromDocument = async (fileInput = documentFile) => {
    if (!fileInput) {
      toast.warning('Vui lòng chọn file Word trước khi nạp câu hỏi.');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', fileInput);

      const response = await axios.post('/api/questions/preview/document', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const parsedQuestions = Array.isArray(response.data) ? response.data : [];
      if (parsedQuestions.length === 0) {
        toast.warning('Không tìm thấy câu hỏi hợp lệ trong file Word.');
        return;
      }

      const normalizedQuestions = parsedQuestions.map((question) => ({
        questionText: question.questionText || '',
        questionType: question.questionType || 'MCQ',
        mediaFiles: [],
        mediaUrl: '',
        passageType: 'LISTENING',
        answers: ['A', 'B', 'C', 'D'].map((label) => {
          const matchedAnswer = (question.answers || []).find(
            (answer) => answer.answerLabel === label,
          );
          return {
            answerLabel: label,
            answerText: matchedAnswer?.answerText || '',
            isCorrect: Boolean(matchedAnswer?.isCorrect),
          };
        }),
      }));

      setQuestions(normalizedQuestions);
      setDocumentFile(null);
      toast.success(`Đã nạp ${normalizedQuestions.length} câu hỏi từ Word.`);
    } catch (error) {
      const message =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        'Không thể nạp câu hỏi từ Word.';
      toast.error(message);
    }
  };


  return (
    <div className={cx('body')}>
      {notification.message && (
        <Alert variant={notification.type} className="mb-3">{notification.message}</Alert>
      )}

      {showCreatorTypeTabs && (
        <CreatorTabs activeCreatorType={activeCreatorType} setCreatorType={setCreatorType} />
      )}

      {activeCreatorType === CREATOR_TYPES.TEST && (
        <Alert variant="info" className="mb-3">
          <strong>Ghi chú:</strong> Sau khi tạo đề, vào chế độ quản lý dạng bảng và bấm biểu tượng bút chì để sửa đề,
          sửa từng câu hỏi, đáp án, cũng như cập nhật file ảnh/audio liên quan.
        </Alert>
      )}

      {activeCreatorType === CREATOR_TYPES.TEST && (
        <Alert variant="light" className="mb-3 border">
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-2">
            <span>
              <strong>Kho lưu trữ câu hỏi:</strong> Nếu bạn muốn tạo đề từ câu hỏi đã lưu trong kho (chọn thủ công hoặc random theo từng part), vào trang này.
            </span>
            <Button
              type="button"
              variant="outline-primary"
              onClick={() => {
                onCancel?.();
                navigate(routes.personalQuestionBank);
              }}
            >
              Mở kho lưu trữ
            </Button>
          </div>
        </Alert>
      )}

      {activeCreatorType !== CREATOR_TYPES.BANK && (
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
          {(activeCreatorType === CREATOR_TYPES.TEST || activeCreatorType === CREATOR_TYPES.BULK) && (
            <>
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
              <Col md={12}>
                <div className={cx('formGroupModern')}>
                  <label>
                    {activeCreatorType === CREATOR_TYPES.BULK
                      ? 'Upload file Word để import câu hỏi số lượng lớn vào kho (DOC/DOCX)'
                      : 'Upload file Word để tạo câu hỏi nhanh (DOC/DOCX)'}
                  </label>
                  <input
                    type="file"
                    accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    className={cx('inputModern')}
                    onChange={handleDocumentFileChange}
                  />
                  {documentFile && (
                    <small className="text-muted d-block mt-2">
                      Đang nạp từ file: {documentFile.name}
                    </small>
                  )}
                </div>
              </Col>
            </>
          )}
        </Row>
      </div>
      )}

      {(activeCreatorType === CREATOR_TYPES.TEST || activeCreatorType === CREATOR_TYPES.BULK) && (
        <>
          <div className={cx('sectionTitle')}>
            <IoLayersOutline /> 2. Danh sách câu hỏi ({questions.length})
          </div>
          {questions.map((q, i) => (
            <QuestionBlock
              key={i}
              question={q}
              index={i}
              removeQuestionFn={removeQuestion}
              updateQuestionTextFn={updateQuestionText}
              updateQuestionFieldFn={updateQuestionField}
              updateAnswerFn={updateAnswer}
              addMediaFilesFn={addMediaFiles}
              removeMediaFileFn={removeMediaFile}
              setPassageTypeFn={setPassageType}
              minQuestions={questions.length}
            />
          ))}
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
                {group.questions.map((q, qIndex) => (
                  <QuestionBlock
                    key={qIndex}
                    question={q}
                    index={qIndex}
                    removeQuestionFn={(i) => removeGroupQuestion(gIndex, i)}
                    updateQuestionTextFn={(i, v) => updateGroupQuestion(gIndex, i, 'questionText', v)}
                    updateAnswerFn={(i, aIndex, field, value) => updateGroupAnswer(gIndex, i, aIndex, field, value)}
                    addMediaFilesFn={() => { }}
                    removeMediaFileFn={() => { }}
                    setPassageTypeFn={() => { }}
                    withMedia={false}
                    minQuestions={group.questions.length}
                  />
                ))}
                <button type="button" className={cx('btnSecondary')} onClick={() => addGroupQuestion(gIndex)}><PlusCircle size={18} /> Thêm câu hỏi</button>
              </div>
            </div>
          ))}
          <button type="button" className={cx('btnSecondary', 'btnGroupAdd')} onClick={addGroup}><IoAddOutline size={20} /> Thêm nhóm passage</button>
        </>
      )}

      {activeCreatorType === CREATOR_TYPES.BANK && (
        <CreateFromBankBody onCancel={onCancel} onSuccess={onSuccess} />
      )}

      {(activeCreatorType === CREATOR_TYPES.TEST || activeCreatorType === CREATOR_TYPES.BULK) && (
        <FormFooter
          loading={loading}
          onAddQuestion={addQuestion}
          onCancel={onCancel}
          onSubmit={handleFormSubmit}
        />
      )}

      {activeCreatorType === CREATOR_TYPES.PASSAGE && (
        <FormFooter
          loading={loading}
          onCancel={onCancel}
          onSubmit={handleFormSubmit}
          submitLabel="Lưu tất cả"
          showAddBtn={false}
        />
      )}
    </div>
  );
};

export default CreateTestFormBody;
