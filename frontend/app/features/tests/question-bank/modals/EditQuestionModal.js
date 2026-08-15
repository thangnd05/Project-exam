'use client';

import { Spinner, Row, Col } from 'react-bootstrap';
import BaseModal from '@/app/components/modal/BaseModal';
import ConfirmDeleteModal from '@/app/components/modal/ConfirmDeleteModal';
import ModalActionFooter from '@/app/components/modal/ModalActionFooter';
import ButtonPrime from '@/app/components/Button/ButtonPrime';
import TagSelector from '@/app/components/TagSelector/TagSelector';
import { buildCollectionTree } from '@/app/utils/collectionTree';
import classNames from 'classnames/bind';
import { CheckCircle2, Pencil, Trash2 } from 'lucide-react';
import { PassageMediaList } from './passageMedia';
import { useEditQuestionModal } from '@/app/features/tests/question-bank/hooks/useEditQuestionModal';
import styles from './EditQuestionModal.module.scss';
import createStyles from '@/app/components/tests/CreateTestModal.module.scss';

const cx = classNames.bind(styles);
const cxCreate = classNames.bind(createStyles);

const ACCEPT_BY_TYPE = {
  LISTENING: 'audio/*',
  READING: 'image/*',
};

const EditQuestionModal = ({ show, onHide, questionId, onSuccess }) => {
  const {
    loading,
    saving,
    formData,
    setFormData,
    setNewFiles,
    newFiles,
    extraContents,
    existingMedia,
    confirmDeleteMedia,
    setConfirmDeleteMedia,
    availableTags,
    selectedTagIds,
    questionCollections,
    isDeletingMedia,
    handlePassageChange,
    addExtraContent,
    updateExtraContent,
    removeExtraContent,
    handleOptionChange,
    addAnswer,
    removeAnswer,
    toggleTag,
    handleDeleteExistingMedia,
    handleSave,
  } = useEditQuestionModal({ show, questionId, onHide, onSuccess });

  return (
    <>
      <BaseModal
        show={show}
        onClose={onHide}
        title="Cập nhật câu hỏi"
        maxWidth={800}
        footer={
          <ModalActionFooter
            onCancel={onHide}
            onSubmit={handleSave}
            loading={saving || loading}
            cancelLabel="Hủy"
            submitLabel="Lưu cập nhật"
            loadingLabel="Đang lưu..."
            submitIcon={CheckCircle2}
          />
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
                    <TagSelector
                      tags={availableTags}
                      selectedIds={selectedTagIds}
                      onToggle={toggleTag}
                    />
                  </Col>
                )}

                <Col md={12}>
                  <label className={cx('formLabel')}>Nguồn (Collection)</label>
                  <select
                    className={cxCreate('inputModern')}
                    value={formData.collectionId}
                    onChange={(e) =>
                      setFormData({ ...formData, collectionId: e.target.value })
                    }
                  >
                    <option value="">-- Không chỉ định --</option>
                    {buildCollectionTree(questionCollections).map((c) => (
                      <option key={c.collectionId} value={c.collectionId}>
                        {c.depth > 0 ? `    └ ${c.name}` : c.name}
                      </option>
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
                    <PassageMediaList
                      items={existingMedia}
                      renderActions={(item) => {
                        if (!item.id) return null;
                        const deleting = isDeletingMedia(item.id);
                        return (
                          <ButtonPrime
                            type="button"
                            size="sm"
                            variant="dangerGhost"
                            className={cx('deleteMediaBtn')}
                            disabled={deleting || saving}
                            onClick={() => setConfirmDeleteMedia(item)}
                          >
                            {deleting ? <Spinner size="sm" /> : <Trash2 size={16} />}
                            {!deleting && <span className="ms-1">Xóa</span>}
                          </ButtonPrime>
                        );
                      }}
                    />
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

                {extraContents.map((text, idx) => (
                  <Col md={12} key={idx}>
                    <label
                      className={cx('formLabel')}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <span>Đoạn văn bổ sung {idx + 2}</span>
                      <ButtonPrime
                        variant="dangerGhost"
                        size="icon"
                        onClick={() => removeExtraContent(idx)}
                        aria-label={`Xóa đoạn văn bổ sung ${idx + 2}`}
                      >
                        <Trash2 size={18} />
                      </ButtonPrime>
                    </label>
                    <textarea
                      className={cxCreate('inputModern')}
                      rows={4}
                      value={text}
                      onChange={(e) => updateExtraContent(idx, e.target.value)}
                      placeholder={`Nội dung đoạn văn thứ ${idx + 2}...`}
                    />
                  </Col>
                ))}

                <Col md={12}>
                  <ButtonPrime variant="outline" size="sm" onClick={addExtraContent}>
                    <Pencil className="me-1" size={16} /> Thêm đoạn văn
                  </ButtonPrime>
                </Col>

                <Col md={12}>
                  <label className={cx('formLabel')}>Bản dịch Passage</label>
                  <textarea
                    className={cxCreate('inputModern')}
                    rows={4}
                    value={formData.passage.contentTranslation || ''}
                    onChange={(e) =>
                      handlePassageChange('contentTranslation', e.target.value)
                    }
                    placeholder="Bản dịch của văn bản / script (tùy chọn)..."
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
                        onChange={() => handleOptionChange(idx, 'isCorrect', true)}
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
                      <ButtonPrime
                        variant="dangerGhost"
                        size="icon"
                        className="ms-2"
                        onClick={() => removeAnswer(idx)}
                        disabled={formData.options.length <= 2}
                        aria-label={`Xóa đáp án ${opt.answerLabel}`}
                      >
                        <Trash2 size={18} />
                      </ButtonPrime>
                    </div>
                  </Col>
                ))}

                <Col md={12} className="mt-2">
                  <ButtonPrime
                    variant="outline"
                    size="sm"
                    onClick={addAnswer}
                    disabled={formData.options.length >= 10}
                  >
                    <Pencil className="me-1" size={16} /> Thêm đáp án
                  </ButtonPrime>
                </Col>

                <Col md={12} className="mt-3">
                  <div className={cx('sectionTitle')}>
                    Giải thích đáp án (không bắt buộc)
                  </div>
                  <textarea
                    className={cxCreate('inputModern', 'explanationTextarea')}
                    rows={6}
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

      <ConfirmDeleteModal
        show={Boolean(confirmDeleteMedia)}
        onClose={() => setConfirmDeleteMedia(null)}
        onConfirm={() => {
          const item = confirmDeleteMedia;
          setConfirmDeleteMedia(null);
          handleDeleteExistingMedia(item);
        }}
        title="Xác nhận xóa media"
        message="Bạn chắc chắn muốn xóa media này? Hành động này không thể hoàn tác."
      />
    </>
  );
};

export default EditQuestionModal;
