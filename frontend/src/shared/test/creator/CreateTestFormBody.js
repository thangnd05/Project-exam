import { useState, useEffect } from 'react';
import { Row, Col, Alert } from 'react-bootstrap';
import { getClassById } from '~/shared/api/classApi';
import { getChapterById } from '~/shared/api/chapterApi';
import { previewDocument, previewPassageDocument } from '~/shared/api/questionApi';
import {
  IoCalendarOutline,
  IoTimeOutline,
  IoImageOutline,
  IoInformationCircleOutline,
  IoSchoolOutline,
  IoBookOutline,
  IoRocketOutline,
  IoAddOutline,
  IoLibraryOutline,
} from 'react-icons/io5';
import { Trash, PlusCircle, ChevronDown, ChevronRight } from 'lucide-react';
import classNames from 'classnames/bind';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { useCreateTest, CREATOR_TYPES } from '~/shared/hooks/useCreateTest';
import CoinPriceField from '~/shared/test/CoinPriceField';
import QuestionBlock from './QuestionBlock';
import CreatorTabs from './CreatorTabs';
import FormFooter from './FormFooter';
import CreateFromBankBody from './CreateFromBankBody';
import ButtonPrime from '~/shared/ui/Button/ButtonPrime';
import routes from '~/shared/config/Routes';
import { buildCollectionTree } from '~/shared/utils/collectionTree';
import styles from '../CreateTestModal.module.scss';

const cx = classNames.bind(styles);

const ACCEPT_BY_TYPE = {
  LISTENING: 'audio/*',
  READING: 'image/*',
  MEDIA: 'image/*,audio/*',
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
    setGroups,
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
    addAnswer,
    removeAnswer,
    addMediaFiles,
    removeMediaFile,
    setPassageType,
    addGroup,
    removeGroup,
    updatePassage,
    addGroupMediaFiles,
    removeGroupMediaFile,
    addGroupPassageText,
    updateGroupPassageText,
    removeGroupPassageText,
    addGroupQuestion,
    removeGroupQuestion,
    updateGroupQuestion,
    setGroupQuestions,
    updateGroupAnswer,
    addGroupAnswer,
    removeGroupAnswer,
    handleSubmit,
    questionCollections,
    availableTags,
  } = useCreateTest({ mode, classId, chapterId, creatorType: activeCreatorType });

  const [className, setClassName] = useState('');
  const [chapterName, setChapterName] = useState('');
  const [groupDocumentFiles, setGroupDocumentFiles] = useState({});
  const [bulkPassageFile, setBulkPassageFile] = useState(null);
  const [collapsedGroups, setCollapsedGroups] = useState(() => new Set());
  const [collapsedQuestions, setCollapsedQuestions] = useState(() => new Set());

  useEffect(() => {
    if (mode === 'class' && classId) {
      getClassById(classId).then((data) => setClassName(data?.className || `Lớp ${classId}`)).catch(() => setClassName(`Lớp ${classId}`));
    }
    if (mode === 'class' && chapterId) {
      getChapterById(chapterId).then((data) => setChapterName(data?.title || `Chapter ${chapterId}`)).catch(() => setChapterName(`Chapter ${chapterId}`));
    }
  }, [mode, classId, chapterId]);

  useEffect(() => {
    setCollapsedGroups((prev) => {
      const next = new Set([...prev].filter((i) => i < groups.length));
      return next.size === prev.size ? prev : next;
    });
  }, [groups.length]);

  const toggleGroupCollapsed = (gIndex) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(gIndex)) {
        next.delete(gIndex);
      } else {
        next.add(gIndex);
      }
      return next;
    });
  };

  useEffect(() => {
    setCollapsedQuestions((prev) => {
      const next = new Set([...prev].filter((i) => i < questions.length));
      return next.size === prev.size ? prev : next;
    });
  }, [questions.length]);

  const toggleQuestionCollapsed = (qIndex) => {
    setCollapsedQuestions((prev) => {
      const next = new Set(prev);
      if (next.has(qIndex)) {
        next.delete(qIndex);
      } else {
        next.add(qIndex);
      }
      return next;
    });
  };

  const getGroupSummary = (group) => {
    const questionCount = group.questions?.length ?? 0;
    const hasPassage =
      Boolean(group.passage?.content?.trim()) ||
      Boolean(group.passage?.contentTranslation?.trim()) ||
      (group.passage?.extraContents || []).some((t) => t?.trim()) ||
      (group.passage?.mediaFiles?.length ?? 0) > 0;
    const parts = [`${questionCount} câu hỏi`];
    if (hasPassage) {
      parts.push('có passage');
    }
    return parts.join(' · ');
  };

  const handleFormSubmit = async () => {
    const success = await handleSubmit();
    if (success) {
      toast.success(
        activeCreatorType === CREATOR_TYPES.TEST
          ? 'Đã tạo đề thi thành công'
          : 'Đã lưu câu hỏi vào kho thành công'
      );
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

  const normTag = (s) => (s || '').trim().toLowerCase();
  const resolveTagNamesToIds = (tagNames = []) => {
    if (!tagNames.length || !availableTags.length) return [];
    const byId = new Map(availableTags.map((t) => [t.tagId, t]));
    const byName = new Map();
    availableTags.forEach((t) => {
      const k = normTag(t.name);
      if (!byName.has(k)) byName.set(k, []);
      byName.get(k).push(t);
    });
    const partName = examParts.find(
      (p) => String(p.examPartId) === String(testInfo.examPartId),
    )?.name || '';
    const partRootId = availableTags.find(
      (t) => (t.parentId == null || t.parentId === '' || !byId.has(t.parentId))
        && normTag(t.name) === normTag(partName),
    )?.tagId || null;

    const ids = [];
    tagNames.forEach((rawSpec) => {
      const spec = (rawSpec || '').trim();
      if (!spec) return;
      let parentName = null;
      let childName = spec;
      const gt = spec.indexOf('>');
      if (gt >= 0) {
        parentName = spec.slice(0, gt).trim();
        childName = spec.slice(gt + 1).trim();
      }
      const cands = byName.get(normTag(childName)) || [];
      if (!cands.length) return;
      let chosen = null;
      if (parentName) {
        chosen = cands.find((t) => {
          const p = t.parentId ? byId.get(t.parentId) : null;
          return p && normTag(p.name) === normTag(parentName);
        });
      } else if (partRootId) {
        chosen = cands.find((t) => t.parentId === partRootId)
          || cands.find((t) => t.tagId === partRootId);
      }
      if (!chosen && !parentName && cands.length === 1) chosen = cands[0];
      if (chosen && !ids.includes(chosen.tagId)) ids.push(chosen.tagId);
    });
    return ids;
  };

  const normalizeParsedQuestions = (parsedQuestions = []) => (
    parsedQuestions.map((question) => {
      const tagNames = question.tagNames || [];
      const tagIds = [...(question.tagIds || []), ...resolveTagNamesToIds(tagNames)]
        .filter((v, i, a) => a.indexOf(v) === i);
      return {
        questionText: question.questionText || '',
        questionType: question.questionType || 'MCQ',
        mediaFiles: [],
        mediaUrl: '',
        passageType: 'LISTENING',
        explanation: question.explanation || '',
        tagIds,
        tagNames,
        answers: (question.answers && question.answers.length > 0)
          ? question.answers.map((ans, idx) => ({
            answerLabel: ans.answerLabel || String.fromCharCode(65 + idx),
            answerText: ans.answerText || "",
            isCorrect: Boolean(ans.isCorrect),
          }))
          : ["A", "B", "C", "D"].map((label) => ({
            answerLabel: label,
            answerText: "",
            isCorrect: false,
          })),
      };
    })
  );

  const handlePreviewQuestionsFromDocument = async (fileInput = documentFile) => {
    if (!fileInput) {
      toast.warning('Vui lòng chọn file Word trước khi nạp câu hỏi.');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', fileInput);

      const data = await previewDocument(formData);

      const parsedQuestions = Array.isArray(data) ? data : [];
      if (parsedQuestions.length === 0) {
        toast.warning('Không tìm thấy câu hỏi hợp lệ trong file Word.');
        return;
      }

      const normalizedQuestions = normalizeParsedQuestions(parsedQuestions);

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

  const handleGroupDocumentFileChange = (gIndex, event) => {
    const selectedFile = event.target.files?.[0] || null;
    setGroupDocumentFiles((prev) => ({ ...prev, [gIndex]: selectedFile }));
    if (selectedFile) {
      handlePreviewGroupQuestionsFromDocument(gIndex, selectedFile);
    }
  };

  const handlePreviewGroupQuestionsFromDocument = async (gIndex, fileInput = groupDocumentFiles[gIndex]) => {
    if (!fileInput) {
      toast.warning('Vui lòng chọn file Word trước khi nạp nhóm câu hỏi.');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', fileInput);

      const data = await previewDocument(formData);

      const parsedQuestions = Array.isArray(data) ? data : [];
      if (parsedQuestions.length === 0) {
        toast.warning('Không tìm thấy câu hỏi hợp lệ trong file Word.');
        return;
      }

      const normalizedQuestions = normalizeParsedQuestions(parsedQuestions);
      setGroupQuestions(gIndex, normalizedQuestions);
      setGroupDocumentFiles((prev) => ({ ...prev, [gIndex]: null }));
      toast.success(`Đã nạp ${normalizedQuestions.length} câu hỏi cho nhóm ${gIndex + 1}.`);
    } catch (error) {
      const message =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        'Không thể nạp nhóm câu hỏi từ Word.';
      toast.error(message);
    }
  };

  const handleBulkPassageFileChange = (event) => {
    const selectedFile = event.target.files?.[0] || null;
    setBulkPassageFile(selectedFile);
    if (selectedFile) {
      handlePreviewBulkPassageFromDocument(selectedFile);
    }
  };

  const handlePreviewBulkPassageFromDocument = async (fileInput = bulkPassageFile) => {
    if (!fileInput) {
      toast.warning('Vui lòng chọn file Word trước khi nạp passage.');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', fileInput);

      const data = await previewPassageDocument(formData);

      const parsedGroups = Array.isArray(data) ? data : [];
      if (parsedGroups.length === 0) {
        toast.warning('Không tìm thấy passage hợp lệ trong file Word.');
        return;
      }

      const normalizedGroups = parsedGroups.map((group) => ({
        passage: {
          content: group.passage?.content || '',
          contentTranslation: group.passage?.contentTranslation || '',
          passageType: group.passage?.passageType || 'READING',
          mediaFiles: [],
          extraContents: Array.isArray(group.passage?.extraContents) ? group.passage.extraContents : [],
          inputMode: 'TEXT',
        },
        questions: normalizeParsedQuestions(group.questions),
      }));

      setGroups(normalizedGroups);
      setBulkPassageFile(null);
      toast.success(`Đã nạp ${normalizedGroups.length} nhóm passage từ Word.`);
    } catch (error) {
      const message =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        'Không thể nạp passage từ Word.';
      toast.error(message);
    }
  };

  const collectionOptions = buildCollectionTree(
    (questionCollections || []).filter(
      (c) =>
        !testInfo.examTypeId ||
        !c.examTypeId ||
        String(c.examTypeId) === String(testInfo.examTypeId),
    ),
  );

  return (
    <>
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
              <strong>Kho lưu trữ câu hỏi:</strong> Nếu bạn muốn tạo đề từ câu hỏi đã lưu trong kho, vào trang này.
            </span>
            <ButtonPrime
              type="button"
              variant="outline"
              size="md"
              onClick={() => {
                onCancel?.();
                navigate(routes.personalQuestionBank);
              }}
            >
              Mở kho lưu trữ
            </ButtonPrime>
          </div>
        </Alert>
      )}

      {activeCreatorType !== CREATOR_TYPES.BANK && (
        <div className={cx('configCard')}>
          <div className={cx('sectionTitle')}>
            1. {activeCreatorType === CREATOR_TYPES.TEST ? 'Cấu hình bài thi' : 'Thông tin chung'}
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

                  {examTypes.filter((t) => !t.childCount).map((t) => <option key={t.examTypeId} value={t.examTypeId}>{t.name}</option>)}
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
              <Col md={3}>
                <div className={cx('formGroupModern')}>
                  <label><IoLibraryOutline /> Bộ đề (Collection)</label>
                  <select className={cx('inputModern')} value={testInfo.collectionId || ''} onChange={(e) => setTestInfo({ ...testInfo, collectionId: e.target.value })}>
                    <option value="">-- Trống --</option>
                    {collectionOptions.map((c) => (
                      <option key={c.collectionId} value={c.collectionId}>
                        {c.depth > 0 ? `    └ ${c.name}` : c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </Col>
            )}
            {(activeCreatorType === CREATOR_TYPES.BULK || activeCreatorType === CREATOR_TYPES.PASSAGE) && (
              <Col md={4}>
                <div className={cx('formGroupModern')}>
                  <label><IoLibraryOutline /> Nhóm (Collection)</label>
                  <select className={cx('inputModern')} value={testInfo.collectionId || ''} onChange={(e) => setTestInfo({ ...testInfo, collectionId: e.target.value })}>
                    <option value="">-- Trống --</option>
                    {collectionOptions.map((c) => (
                      <option key={c.collectionId} value={c.collectionId}>
                        {c.depth > 0 ? `    └ ${c.name}` : c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </Col>
            )}
            {(activeCreatorType === CREATOR_TYPES.TEST || activeCreatorType === CREATOR_TYPES.BULK) && (
              <>
                {activeCreatorType === CREATOR_TYPES.TEST && (
                  <>
                    <Col md={activeCreatorType === CREATOR_TYPES.TEST ? 3 : 4}>
                      <div className={cx('formGroupModern')}>
                        <label><IoTimeOutline /> Thời gian (phút)</label>
                        <input type="number" className={cx('inputModern')} value={testInfo.durationMinutes} onChange={(e) => setTestInfo({ ...testInfo, durationMinutes: e.target.value })} />
                      </div>
                    </Col>
                    <Col md={activeCreatorType === CREATOR_TYPES.TEST ? 3 : 4}>
                      <div className={cx('formGroupModern')}>
                        <label><IoRocketOutline /> Lượt làm tối đa</label>
                        <input type="number" className={cx('inputModern')} value={testInfo.maxAttempts} onChange={(e) => setTestInfo({ ...testInfo, maxAttempts: e.target.value })} />
                      </div>
                    </Col>
                    <CoinPriceField
                      md={3}
                      isPublic={mode !== 'class'}
                      value={testInfo.costCoins}
                      onChange={(v) => setTestInfo({ ...testInfo, costCoins: v })}
                      groupClassName={cx('formGroupModern')}
                      inputClassName={cx('inputModern')}
                    />
                    <Col md={activeCreatorType === CREATOR_TYPES.TEST ? 6 : 4}>
                      <div className={cx('formGroupModern')}>
                        <label><IoCalendarOutline /> Thời gian bắt đầu</label>
                        <input type="datetime-local" className={cx('inputModern')} value={testInfo.availableFrom} onChange={(e) => setTestInfo({ ...testInfo, availableFrom: e.target.value })} />
                      </div>
                    </Col>
                    <Col md={activeCreatorType === CREATOR_TYPES.TEST ? 6 : 4}>
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
            2. Danh sách câu hỏi ({questions.length})
          </div>
          {questions.map((q, i) => (
            <QuestionBlock
              key={i}
              question={q}
              index={i}
              radioGroupPrefix="single-question"
              removeQuestionFn={removeQuestion}
              updateQuestionTextFn={updateQuestionText}
              updateQuestionFieldFn={updateQuestionField}
              updateAnswerFn={updateAnswer}
              addAnswerFn={addAnswer}
              removeAnswerFn={removeAnswer}
              addMediaFilesFn={addMediaFiles}
              removeMediaFileFn={removeMediaFile}
              setPassageTypeFn={setPassageType}
              availableTags={availableTags}
              minQuestions={questions.length}
              collapsible
              isCollapsed={collapsedQuestions.has(i)}
              onToggleCollapsed={toggleQuestionCollapsed}
            />
          ))}
        </>
      )}

      {activeCreatorType === CREATOR_TYPES.PASSAGE && (
        <>
          <div className={cx('sectionTitle')}>
            2. Danh sách nhóm ({groups.length})
          </div>

          <div className={cx('groupCard')} style={{ borderStyle: 'dashed', backgroundColor: '#f8fafc', marginBottom: '20px' }}>
            <div className={cx('formGroupModern', 'mb-0')}>
              <label className="mb-2 d-block fw-bold text-primary">
                Upload file Word nạp NHIỀU Passage tự động (DOC/DOCX)
              </label>
              <input
                type="file"
                accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                className={cx('inputModern')}
                onChange={handleBulkPassageFileChange}
              />
              <small className="text-muted d-block mt-2">
                File của bạn cần có dòng phân cách Passage (ví dụ: "Passage 1:", "Bài đọc 2:"). Các câu hỏi bên dưới sẽ tự động được xếp vào đúng Passage.
                Nếu 1 passage có NHIỀU đoạn văn, ngăn các đoạn bằng dòng "Đoạn 2:", "Đoạn 3:"… (đoạn đầu không cần đánh dấu); đặt trước dòng "Dịch:" nếu có.
              </small>
            </div>
          </div>

          {groups.map((group, gIndex) => {
            const isCollapsed = collapsedGroups.has(gIndex);
            return (
            <div key={gIndex} className={cx('groupCard', { collapsed: isCollapsed })}>
              <div className={cx('groupHeader')}>
                <button
                  type="button"
                  className={cx('groupToggleBtn')}
                  onClick={() => toggleGroupCollapsed(gIndex)}
                  aria-expanded={!isCollapsed}
                  aria-label={isCollapsed ? `Mở nhóm ${gIndex + 1}` : `Thu gọn nhóm ${gIndex + 1}`}
                >
                  {isCollapsed ? <ChevronRight size={20} /> : <ChevronDown size={20} />}
                  <h4 className={cx('groupTitle')}>Nhóm thứ {gIndex + 1}</h4>
                  <span className={cx('groupSummaryBadge')}>{getGroupSummary(group)}</span>
                </button>
                {groups.length > 1 && (
                  <ButtonPrime variant="dangerGhost" size="icon" onClick={() => removeGroup(gIndex)} aria-label={`Xóa nhóm ${gIndex + 1}`}>
                    <Trash size={18} />
                  </ButtonPrime>
                )}
              </div>
              {!isCollapsed && (
              <>
              <div className={cx('passageSection')}>
                <div className={cx('formGroupModern')}>
                  <label className="mb-2 d-block fw-bold">Nội dung Passage (tùy chọn)</label>
                  <textarea
                    className={cx('inputModern')}
                    rows={3}
                    value={group.passage.content}
                    onChange={(e) => updatePassage(gIndex, 'content', e.target.value)}
                    placeholder="Nhập nội dung văn bản nếu có..."
                  />
                </div>
                {(group.passage.extraContents || []).map((text, tIdx) => (
                  <div className={cx('formGroupModern')} key={tIdx}>
                    <label className="mb-2 d-flex justify-content-between align-items-center fw-bold">
                      <span>Đoạn văn bổ sung {tIdx + 2}</span>
                      <ButtonPrime
                        variant="dangerGhost"
                        size="icon"
                        onClick={() => removeGroupPassageText(gIndex, tIdx)}
                        aria-label={`Xóa đoạn văn bổ sung ${tIdx + 2}`}
                      >
                        <Trash size={14} />
                      </ButtonPrime>
                    </label>
                    <textarea
                      className={cx('inputModern')}
                      rows={3}
                      value={text}
                      onChange={(e) => updateGroupPassageText(gIndex, tIdx, e.target.value)}
                      placeholder={`Nội dung đoạn văn thứ ${tIdx + 2}...`}
                    />
                  </div>
                ))}
                <div className="mb-3">
                  <ButtonPrime
                    type="button"
                    variant="outline"
                    size="sm"
                    className={cx('btnSecondary')}
                    onClick={() => addGroupPassageText(gIndex)}
                  >
                    <PlusCircle size={16} className="me-1" /> Thêm đoạn văn
                  </ButtonPrime>
                </div>
                <div className={cx('formGroupModern')}>
                  <label className="mb-2 d-block fw-bold">Bản dịch Passage (tùy chọn)</label>
                  <textarea
                    className={cx('inputModern')}
                    rows={3}
                    value={group.passage.contentTranslation || ''}
                    onChange={(e) => updatePassage(gIndex, 'contentTranslation', e.target.value)}
                    placeholder="Bản dịch của nội dung passage (phần &quot;Dịch:&quot; trong file Word)..."
                  />
                </div>
                <div className={cx('formGroupModern')}>
                  <label className="mb-2 d-block fw-bold">Upload phương tiện (ảnh / audio)</label>
                  <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
                    <input
                      type="file"
                      multiple
                      accept={ACCEPT_BY_TYPE.MEDIA}
                      className={cx('inputModern')}
                      style={{ width: 'auto' }}
                      onChange={(e) => { addGroupMediaFiles(gIndex, e.target.files); e.target.value = ''; }}
                    />
                  </div>
                  {group.passage.mediaFiles?.length > 0 && (
                    <ul className="list-unstyled mb-0 mt-2">
                      {group.passage.mediaFiles.map((file, fIdx) => (
                        <li key={fIdx} className="d-flex align-items-center gap-2 mb-1">
                          <span className="small text-secondary">{file.name}</span>
                          <ButtonPrime
                            variant="dangerGhost"
                            size="icon"
                            onClick={() => removeGroupMediaFile(gIndex, fIdx)}
                          >
                            <Trash size={14} />
                          </ButtonPrime>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
              <div className={cx('questionsSection')}>
                <div className={cx('formGroupModern')}>
                  <label>Upload file Word để nạp câu hỏi cho nhóm này (DOC/DOCX)</label>
                  <input
                    type="file"
                    accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    className={cx('inputModern')}
                    onChange={(e) => handleGroupDocumentFileChange(gIndex, e)}
                  />
                  {groupDocumentFiles[gIndex] && (
                    <small className="text-muted d-block mt-2">
                      Đang nạp cho nhóm {gIndex + 1}: {groupDocumentFiles[gIndex].name}
                    </small>
                  )}
                </div>
                {group.questions.map((q, qIndex) => (
                  <QuestionBlock
                    key={qIndex}
                    question={q}
                    index={qIndex}
                    radioGroupPrefix={`group-${gIndex}-question`}
                    removeQuestionFn={(i) => removeGroupQuestion(gIndex, i)}
                    updateQuestionTextFn={(i, v) => updateGroupQuestion(gIndex, i, 'questionText', v)}
                    updateQuestionFieldFn={(i, field, value) => updateGroupQuestion(gIndex, i, field, value)}
                    updateAnswerFn={(i, aIndex, field, value) => updateGroupAnswer(gIndex, i, aIndex, field, value)}
                    addAnswerFn={(i) => addGroupAnswer(gIndex, i)}
                    removeAnswerFn={(i, aIndex) => removeGroupAnswer(gIndex, i, aIndex)}
                    addMediaFilesFn={() => { }}
                    removeMediaFileFn={() => { }}
                    setPassageTypeFn={() => { }}
                    availableTags={availableTags}
                    withMedia={false}
                    minQuestions={group.questions.length}
                  />
                ))}
                <ButtonPrime type="button" variant="outline" size="sm" className={cx('btnSecondary')} onClick={() => addGroupQuestion(gIndex)}><PlusCircle size={18} /> Thêm câu hỏi</ButtonPrime>
              </div>
              </>
              )}
            </div>
            );
          })}
          <ButtonPrime type="button" variant="outline" size="sm" className={cx('btnSecondary', 'btnGroupAdd')} onClick={addGroup}><IoAddOutline size={20} /> Thêm nhóm passage</ButtonPrime>
        </>
      )}

      {activeCreatorType === CREATOR_TYPES.BANK && (
        <CreateFromBankBody
          mode={mode}
          classId={classId}
          chapterId={chapterId}
          onCancel={onCancel}
          onSuccess={onSuccess}
        />
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
    </>
  );
};

export default CreateTestFormBody;
