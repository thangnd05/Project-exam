import React, { useState, useEffect, useRef } from 'react';
import { Button, Badge, Spinner, Row, Col } from 'react-bootstrap';
import BaseModal from '~/components/common/modal/BaseModal';
import { getQuestionById, updateQuestion } from '~/api/questionApi';
import { getExamPartById } from '~/api/examPartApi';
import { deletePassageMedia } from '~/api/passageMediaApi';
import { getQuestionCollections } from '~/api/questionCollectionApi';
import { toast } from 'react-toastify';
import classNames from 'classnames/bind';
import {
  IoCheckmarkCircleOutline,
  IoCloseOutline,
  IoCreateOutline,
  IoTrashOutline,
} from 'react-icons/io5';
import { getTagsFlatByExamType } from '~/api/tagApi';
import styles from './EditQuestionModal.module.scss';
import createStyles from '~/components/test/CreateTestModal.module.scss';

const cx = classNames.bind(styles);
const cxCreate = classNames.bind(createStyles);

const ACCEPT_BY_TYPE = {
  LISTENING: 'audio/*',
  READING: 'image/*',
};

const getMediaItemsFromQuestion = (questionDetail) => {
  if (!questionDetail) return [];
  const list = Array.isArray(questionDetail.passageMedia)
    ? questionDetail.passageMedia
    : [];

  const items = list
    .map((m) => ({
      id: m?.id ?? null,
      mediaUrl: m?.mediaUrl || '',
      mediaType: (m?.mediaType || '').toUpperCase(),
    }))
    .filter((m) => !!m.mediaUrl);

  const fallbackUrl = questionDetail?.passage?.mediaUrl;
  if (fallbackUrl && !items.some((m) => m.mediaUrl === fallbackUrl)) {
    items.push({
      id: null, // fallback cũ không có id để xóa qua /api/passage-media/{id}
      mediaUrl: fallbackUrl,
      mediaType:
        (questionDetail?.passage?.passageType || '').toUpperCase() ===
          'LISTENING'
          ? 'AUDIO'
          : 'IMAGE',
    });
  }
  return items;
};

const EditQuestionModal = ({ show, onHide, questionId, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [newFiles, setNewFiles] = useState([]);
  const [existingMedia, setExistingMedia] = useState([]);
  const [deletingMediaIds, setDeletingMediaIds] = useState([]);
  const [questionCollections, setQuestionCollections] = useState([]);
  const [availableTags, setAvailableTags] = useState([]);
  const [selectedTagIds, setSelectedTagIds] = useState([]);

  const onHideRef = useRef(onHide);

  useEffect(() => {
    onHideRef.current = onHide;
  }, [onHide]);

  useEffect(() => {
    getQuestionCollections()
      .then((data) => {
        const list = Array.isArray(data) ? data : (data.data || data.content || []);
        setQuestionCollections(list);
      })
      .catch((err) => console.error('Failed to load collections', err));
  }, []);

  const [formData, setFormData] = useState({
    classId: '',
    examPartId: '',
    collectionId: '',
    questionType: 'MCQ',
    questionText: '',
    explanation: '',
    isBank: true,
    passage: {
      passageType: 'READING',
      content: '',
      mediaUrl: '',
    },
    options: [],
  });

  useEffect(() => {
    if (!show || !questionId) return;
    let cancelled = false;

    const fetchQuestionDetails = async (id) => {
      setLoading(true);
      try {
        const questionDetail = await getQuestionById(id);

        let mappedOptions = [];
        if (questionDetail.answers && questionDetail.answers.length > 0) {
          mappedOptions = questionDetail.answers.map((ans) => ({
            id: ans.answerId || ans.id,
            answerLabel: ans.answerLabel,
            content: ans.answerText || ans.content || '',
            isCorrect: ans.isCorrect,
          }));
        } else {
          // Fallback if no answers
          mappedOptions = [
            { id: null, answerLabel: 'A', content: '', isCorrect: false },
            { id: null, answerLabel: 'B', content: '', isCorrect: false },
          ];
        }

        if (!cancelled) {
          setFormData({
            classId: questionDetail.classId || '',
            examPartId: questionDetail.examPartId || '',
            questionType: questionDetail.questionType || 'MCQ',
            questionText: questionDetail.questionText || '',
            explanation: questionDetail.explanation || '',
            collectionId: questionDetail.collectionId || '',
            isBank:
              questionDetail.isBank !== undefined
                ? questionDetail.isBank
                : true,
            passage: questionDetail.passage
              ? {
                passageType: questionDetail.passage.passageType || 'READING',
                content: questionDetail.passage.content || '',
                mediaUrl: questionDetail.passage.mediaUrl || '',
              }
              : { passageType: 'READING', content: '', mediaUrl: '' },
            options: mappedOptions,
          });
          setExistingMedia(getMediaItemsFromQuestion(questionDetail));

          // Load tags: lấy danh sách tag đã gắn + danh sách tag available
          const currentTagIds = (questionDetail.tags || []).map((t) => t.tagId);
          setSelectedTagIds(currentTagIds);

          if (questionDetail.examTypeId) {
            getTagsFlatByExamType(questionDetail.examTypeId)
              .then((tags) => { if (!cancelled) setAvailableTags(tags); })
              .catch(() => {});
          } else if (questionDetail.examPartId) {
            // Lấy examTypeId qua examPart
            getExamPartById(questionDetail.examPartId)
              .then((part) => {
                const etId = part?.examTypeId;
                if (etId && !cancelled) {
                  return getTagsFlatByExamType(etId);
                }
                return [];
              })
              .then((tags) => { if (!cancelled) setAvailableTags(Array.isArray(tags) ? tags : []); })
              .catch(() => {});
          }
        }
      } catch (error) {
        if (!cancelled) {
          toast.error('Không thể tải dữ liệu câu hỏi');
          onHideRef.current?.();
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    setNewFiles([]);
    setExistingMedia([]);
    setDeletingMediaIds([]);
    fetchQuestionDetails(questionId);

    return () => {
      cancelled = true;
    };
  }, [show, questionId]);

  const handlePassageChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      passage: { ...prev.passage, [field]: value },
    }));
  };

  const handleOptionChange = (idx, field, value) => {
    const updated = [...formData.options];
    if (field === 'isCorrect' && value) {
      for (let i = 0; i < updated.length; i += 1) {
        updated[i] = { ...updated[i], isCorrect: i === idx };
      }
    } else {
      updated[idx] = { ...updated[idx], [field]: value };
    }
    setFormData({ ...formData, options: updated });
  };

  const getAnswerLabelByIndex = (index) => String.fromCharCode(65 + index);

  const addAnswer = () => {
    if (formData.options.length >= 10) {
      toast.warning('Tối đa 10 đáp án.');
      return;
    }
    const nextLabel = getAnswerLabelByIndex(formData.options.length);
    const newOptions = [
      ...formData.options,
      { id: null, answerLabel: nextLabel, content: '', isCorrect: false },
    ];
    setFormData({ ...formData, options: newOptions });
  };

  const removeAnswer = (idx) => {
    if (formData.options.length <= 2) {
      toast.warning('Tối thiểu phải có 2 đáp án.');
      return;
    }
    const updated = formData.options.filter((_, i) => i !== idx).map((opt, i) => ({
      ...opt,
      answerLabel: getAnswerLabelByIndex(i),
    }));
    setFormData({ ...formData, options: updated });
  };

  const handleDeleteExistingMedia = async (item) => {
    if (!item?.id) {
      toast.info('Media này không có id để xóa trực tiếp.');
      return;
    }

    const confirmed = window.confirm('Bạn chắc chắn muốn xóa media này?');
    if (!confirmed) return;

    setDeletingMediaIds((prev) => [...prev, item.id]);
    try {
      await deletePassageMedia(item.id);

      setExistingMedia((prev) => prev.filter((m) => m.id !== item.id));

      if (
        formData.passage.mediaUrl &&
        formData.passage.mediaUrl === item.mediaUrl
      ) {
        setFormData((prev) => ({
          ...prev,
          passage: { ...prev.passage, mediaUrl: '' },
        }));
      }

      toast.success('Đã xóa media');
    } catch (error) {
      const msg = error.response?.data?.message ?? error.message;
      toast.error(`Xóa media thất bại: ${msg}`);
    } finally {
      setDeletingMediaIds((prev) => prev.filter((id) => id !== item.id));
    }
  };

  const handleSave = async () => {
    setSaving(true);

    const payload = {
      classId: formData.classId ? String(formData.classId) : null,
      examPartId: formData.examPartId
        ? String(formData.examPartId)
        : null,
      chapterId: null,
      questionType: formData.questionType,
      questionText: formData.questionText,
      explanation: formData.explanation || '',
      collectionId: formData.collectionId ? String(formData.collectionId) : '',
      isBank: formData.isBank,
      answers: formData.options.map((opt) => ({
        id: opt.id,
        answerId: opt.id, // tương thích backend syncAnswers
        answerLabel: opt.answerLabel,
        answerText: opt.content,
        isCorrect: opt.isCorrect,
      })),
      tagIds: selectedTagIds,
    };

    const hasPassage =
      formData.passage.content?.trim() !== '' ||
      formData.passage.mediaUrl?.trim() !== '';

    if (hasPassage) {
      payload.passage = {
        passageType: formData.passage.passageType,
        content: formData.passage.content,
        mediaUrl: formData.passage.mediaUrl,
      };
    }

    try {
      if (newFiles.length > 0) {
        const fd = new FormData();
        fd.append('request', JSON.stringify(payload));
        newFiles.forEach((file, index) => {
          fd.append(`file${index}`, file);
        });
        await updateQuestion(questionId, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        await updateQuestion(questionId, payload, {
          headers: { 'Content-Type': 'application/json' },
        });
      }

      toast.success('Cập nhật câu hỏi thành công!');
      onSuccess();
    } catch (error) {
      const msg = error.response?.data?.message ?? error.message;
      toast.error(`Lỗi khi cập nhật: ${msg}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <BaseModal
      show={show}
      onClose={onHide}
      title="Cập nhật câu hỏi"
      icon={IoCreateOutline}
      maxWidth={800}
      footer={
        <>
          <Button variant="secondary" onClick={onHide} disabled={saving}>
            <IoCloseOutline size={20} className="me-1" /> Hủy
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={saving || loading}
          >
            {saving ? (
              <Spinner size="sm" />
            ) : (
              <IoCheckmarkCircleOutline size={20} className="me-1" />
            )}
            Lưu cập nhật
          </Button>
        </>
      }
    >
      <div className={cx('modalBody')}>
        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" />
            <p className="mt-2 text-muted">Đang tải dữ liệu...</p>
          </div>
        ) : (
          <div className={cxCreate('partBlock')}>
            <Row className="g-3">
              <Col md={12}>
                <label className={cx('formLabel')}>Nội dung câu hỏi</label>
                <textarea
                  className={cxCreate('inputModern')}
                  rows={3}
                  value={formData.questionText}
                  onChange={(e) =>
                    setFormData({ ...formData, questionText: e.target.value })
                  }
                />
              </Col>

              {availableTags.length > 0 && (
                <Col md={12}>
                  <label className={cx('formLabel')}>Tag phân loại</label>
                  <div className="d-flex flex-wrap gap-2">
                    {availableTags.map((tag) => {
                      const isSelected = selectedTagIds.includes(tag.tagId);
                      return (
                        <Badge
                          key={tag.tagId}
                          bg={isSelected ? 'primary' : 'light'}
                          text={isSelected ? 'white' : 'dark'}
                          role="button"
                          className="border px-2 py-1 fw-medium tag-badge"
                          onClick={() =>
                            setSelectedTagIds((prev) =>
                              isSelected
                                ? prev.filter((id) => id !== tag.tagId)
                                : [...prev, tag.tagId],
                            )
                          }
                        >
                          {tag.name}
                        </Badge>
                      );
                    })}
                  </div>
                </Col>
              )}

              <Col md={12}>
                <label className={cx('formLabel')}>Nguồn (Collection)</label>
                <select
                  className={cxCreate('inputModern')}
                  value={formData.collectionId}
                  onChange={(e) => setFormData({ ...formData, collectionId: e.target.value })}
                >
                  <option value="">-- Không chỉ định --</option>
                  {questionCollections.map((c) => (
                    <option key={c.collectionId} value={c.collectionId}>{c.name}</option>
                  ))}
                </select>
              </Col>

              <Col md={12}>
                <div className={cx('sectionTitle')}>
                  Tùy chọn đoạn văn / Audio (Passage)
                </div>
              </Col>

              <Col md={4}>
                <label className={cx('formLabel')}>Loại Passage</label>
                <select
                  className={cxCreate('inputModern')}
                  value={formData.passage.passageType}
                  onChange={(e) =>
                    handlePassageChange('passageType', e.target.value)
                  }
                >
                  <option value="READING">Đọc (ảnh)</option>
                  <option value="LISTENING">Nghe (audio)</option>
                </select>
              </Col>

              <Col md={8}>
                <label className={cx('formLabel')}>
                  Đường dẫn Audio/Media (nếu có)
                </label>
                <input
                  type="text"
                  className={cxCreate('inputModern')}
                  placeholder="https://.../audio.mp3"
                  value={formData.passage.mediaUrl}
                  onChange={(e) =>
                    handlePassageChange('mediaUrl', e.target.value)
                  }
                />
              </Col>

              <Col md={12}>
                <label className={cx('formLabel')}>
                  Upload thêm file (ảnh / audio)
                </label>
                <input
                  type="file"
                  className={cxCreate('inputModern')}
                  multiple
                  accept={
                    ACCEPT_BY_TYPE[formData.passage.passageType] ||
                    ACCEPT_BY_TYPE.READING
                  }
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    setNewFiles(files);
                  }}
                />
                {newFiles.length > 0 && (
                  <small className="text-muted d-block mt-1">
                    Đã chọn {newFiles.length} file mới để append vào
                    passage_media.
                  </small>
                )}
              </Col>

              {existingMedia.length > 0 && (
                <Col md={12}>
                  <label className={cx('formLabel')}>
                    Media passage hiện có
                  </label>
                  <div className={cx('existingMediaList')}>
                    {existingMedia.map((item, idx) => {
                      const url = item.mediaUrl;
                      const isAudio =
                        item.mediaType === 'AUDIO' ||
                        /\.(mp3|wav|ogg|m4a)(\?.*)?$/i.test(url);
                      const isImage =
                        item.mediaType === 'IMAGE' ||
                        /\.(png|jpe?g|gif|webp|svg)(\?.*)?$/i.test(url);
                      const deleting =
                        item.id && deletingMediaIds.includes(item.id);

                      return (
                        <div
                          key={`${item.id || url}-${idx}`}
                          className={cx('existingMediaCard')}
                        >
                          <div className={cx('existingMediaMeta')}>
                            <span>
                              {isAudio ? 'Audio' : isImage ? 'Ảnh' : 'Tài liệu'}{' '}
                              ·{' '}
                              <a href={url} target="_blank" rel="noreferrer">
                                Mở file
                              </a>
                            </span>

                            {item.id ? (
                              <Button
                                type="button"
                                size="sm"
                                variant="outline-danger"
                                className={cx('deleteMediaBtn')}
                                disabled={deleting || saving}
                                onClick={() => handleDeleteExistingMedia(item)}
                              >
                                {deleting ? (
                                  <Spinner size="sm" />
                                ) : (
                                  <IoTrashOutline />
                                )}
                                {!deleting && <span className="ms-1">Xóa</span>}
                              </Button>
                            ) : null}
                          </div>

                          {isAudio ? (
                            <audio
                              controls
                              src={url}
                              className={cx('existingMediaAudio')}
                            />
                          ) : isImage ? (
                            <img
                              src={url}
                              alt={`passage-media-${idx + 1}`}
                              className={cx('existingMediaImage')}
                            />
                          ) : (
                            <div className={cx('existingMediaDoc')}>{url}</div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </Col>
              )}

              <Col md={12}>
                <label className={cx('formLabel')}>Nội dung Passage</label>
                <textarea
                  className={cxCreate('inputModern')}
                  rows={4}
                  value={formData.passage.content}
                  onChange={(e) =>
                    handlePassageChange('content', e.target.value)
                  }
                  placeholder="Văn bản bài đọc / Script..."
                />
              </Col>

              <Col md={12}>
                <div className={cx('sectionTitle')}>Đáp án</div>
              </Col>

              {formData.options.map((opt, idx) => (
                <Col md={6} key={idx} className="mb-2">
                  <div className={cxCreate('answerItem')}>
                    <input
                      type="radio"
                      name="question-correct-answer"
                      checked={opt.isCorrect}
                      onChange={() =>
                        handleOptionChange(idx, 'isCorrect', true)
                      }
                    />
                    <span className="ms-2 fw-bold">{opt.answerLabel}.</span>
                    <input
                      type="text"
                      className={cxCreate('inputModern', 'ms-2')}
                      style={{ flex: 1 }}
                      value={opt.content}
                      onChange={(e) =>
                        handleOptionChange(idx, 'content', e.target.value)
                      }
                      placeholder={`Nội dung ${opt.answerLabel}...`}
                    />
                    <Button
                      variant="link"
                      className="text-danger p-0 ms-2"
                      onClick={() => removeAnswer(idx)}
                      disabled={formData.options.length <= 2}
                      aria-label={`Xóa đáp án ${opt.answerLabel}`}
                    >
                      <IoTrashOutline size={18} />
                    </Button>
                  </div>
                </Col>
              ))}

              <Col md={12} className="mt-2">
                <Button
                  variant="outline-primary"
                  size="sm"
                  onClick={addAnswer}
                  disabled={formData.options.length >= 10}
                >
                  <IoCreateOutline className="me-1" /> Thêm đáp án
                </Button>
              </Col>

              <Col md={12} className="mt-3">
                <div className={cx('sectionTitle')}>Giải thích đáp án (không bắt buộc)</div>
                <textarea
                  className={cxCreate('inputModern')}
                  rows={3}
                  value={formData.explanation}
                  onChange={(e) =>
                    setFormData({ ...formData, explanation: e.target.value })
                  }
                  placeholder="Nhập giải thích đáp án (hiển thị cho học sinh khi xem lại bài)..."
                />
              </Col>

            </Row>
          </div>
        )}
      </div>
    </BaseModal>
  );
};

export default EditQuestionModal;
