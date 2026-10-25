'use client';

import { Spinner, Row, Col } from 'react-bootstrap';
import BaseModal from '@/app/components/modal/BaseModal';
import ConfirmDeleteModal from '@/app/components/modal/ConfirmDeleteModal';
import ModalActionFooter from '@/app/components/modal/ModalActionFooter';
import ButtonPrime from '@/app/components/Button/ButtonPrime';
import TagSelector from '@/app/features/tests/TagSelector/TagSelector';
import { buildCollectionTree } from '@/app/features/tests/collectionTree';
import classNames from 'classnames/bind';
import { useTranslations } from 'next-intl';
import { Trash2 } from 'lucide-react';
import { PassageMediaList } from '@/app/features/tests/passageMedia';
import { useEditQuestionModal } from '@/app/features/tests/hooks/useEditQuestionModal';
import { QuestionUsageScope } from '@/app/enums';
import styles from '@/app/features/tests/EditQuestionModal.module.scss';
import createStyles from '@/app/features/tests/CreateTestModal.module.scss';

const cx = classNames.bind(styles);
const cxCreate = classNames.bind(createStyles);

const ACCEPT_BY_TYPE: Record<string, string> = {
  LISTENING: 'audio/*',
  READING: 'image/*',
};

type EditQuestionModalProps = {
  show: boolean;
  onHide: () => void;
  questionId?: string | null;
  onSuccess: () => void;
};

const EditQuestionModal = ({ show, onHide, questionId, onSuccess }: EditQuestionModalProps) => {
  const t = useTranslations('TestCreator');
  const tCommon = useTranslations('Common');
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
    isMsq,
    toggleMsq,
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
        title={t('editQuestion.title')}
        maxWidth={800}
        footer={
          <ModalActionFooter
            onCancel={onHide}
            onSubmit={handleSave}
            loading={saving || loading}
            cancelLabel={tCommon('cancelShort')}
            submitLabel={t('editTest.submit')}
            loadingLabel={t('editTest.saving')}
          />
        }
      >
        <div className={cx('modalBody')}>
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2 text-muted">{t('editQuestion.loading')}</p>
            </div>
          ) : (
            <div className={cxCreate('partBlock')}>
              <Row className="g-3">
                <Col md={12}>
                  <label className={cx('formLabel')}>{t('editQuestion.questionText')}</label>
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
                  <label className={cx('formLabel')}>{t('editQuestion.usageScope')}</label>
                  <select
                    className={cxCreate('inputModern')}
                    value={formData.usageScope}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        usageScope: e.target.value as QuestionUsageScope,
                      })
                    }
                  >
                    <option value={QuestionUsageScope.EXAM}>
                      {t('editQuestion.usageExam')}
                    </option>
                    <option value={QuestionUsageScope.PRACTICE}>
                      {t('editQuestion.usagePractice')}
                    </option>
                  </select>
                </Col>

                <Col md={12}>
                  <label className={cx('formLabel')}>{t('editQuestion.collection')}</label>
                  <select
                    className={cxCreate('inputModern')}
                    value={formData.collectionId}
                    onChange={(e) =>
                      setFormData({ ...formData, collectionId: e.target.value })
                    }
                  >
                    <option value="">{t('editQuestion.noCollection')}</option>
                    {buildCollectionTree(questionCollections).map((c) => (
                      <option key={c.collectionId} value={c.collectionId}>
                        {c.depth > 0 ? `    └ ${c.name}` : c.name}
                      </option>
                    ))}
                  </select>
                </Col>

                <Col md={12}>
                  <div className={cx('sectionTitle')}>
                    {t('editQuestion.passageSection')}
                  </div>
                </Col>

                <Col md={4}>
                  <label className={cx('formLabel')}>{t('editQuestion.passageType')}</label>
                  <select
                    className={cxCreate('inputModern')}
                    value={formData.passage.passageType}
                    onChange={(e) =>
                      handlePassageChange('passageType', e.target.value)
                    }
                  >
                    <option value="READING">{t('editQuestion.reading')}</option>
                    <option value="LISTENING">{t('editQuestion.listening')}</option>
                  </select>
                </Col>

                <Col md={8}>
                  <label className={cx('formLabel')}>
                    {t('editQuestion.mediaUrl')}
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
                    {t('editQuestion.uploadMore')}
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
                      {t('editQuestion.newFilesSelected', { count: newFiles.length })}
                    </small>
                  )}
                </Col>

                {existingMedia.length > 0 && (
                  <Col md={12}>
                    <label className={cx('formLabel')}>
                      {t('editQuestion.existingMedia')}
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
                            {!deleting && <span className="ms-1">{t('editQuestion.delete')}</span>}
                          </ButtonPrime>
                        );
                      }}
                    />
                  </Col>
                )}

                <Col md={12}>
                  <label className={cx('formLabel')}>{t('editQuestion.passageContent')}</label>
                  <textarea
                    className={cxCreate('inputModern')}
                    rows={4}
                    value={formData.passage.content}
                    onChange={(e) =>
                      handlePassageChange('content', e.target.value)
                    }
                    placeholder={t('editQuestion.passageContentPlaceholder')}
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
                      <span>{t('form.passage.extraText', { number: idx + 2 })}</span>
                      <ButtonPrime
                        variant="dangerGhost"
                        size="icon"
                        onClick={() => removeExtraContent(idx)}
                        aria-label={t('form.passage.removeExtraText', { number: idx + 2 })}
                      >
                        <Trash2 size={18} />
                      </ButtonPrime>
                    </label>
                    <textarea
                      className={cxCreate('inputModern')}
                      rows={4}
                      value={text}
                      onChange={(e) => updateExtraContent(idx, e.target.value)}
                      placeholder={t('form.passage.extraTextPlaceholder', { number: idx + 2 })}
                    />
                  </Col>
                ))}

                <Col md={12}>
                  <ButtonPrime variant="outline" size="sm" onClick={addExtraContent}>
                    {t('form.passage.addText')}
                  </ButtonPrime>
                </Col>

                <Col md={12}>
                  <label className={cx('formLabel')}>{t('editQuestion.translation')}</label>
                  <textarea
                    className={cxCreate('inputModern')}
                    rows={4}
                    value={formData.passage.contentTranslation || ''}
                    onChange={(e) =>
                      handlePassageChange('contentTranslation', e.target.value)
                    }
                    placeholder={t('editQuestion.translationPlaceholder')}
                  />
                </Col>

                <Col md={12}>
                  <div
                    className={cx('sectionTitle')}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '1.2rem',
                    }}
                  >
                    <span>{t('editQuestion.answers')}</span>
                    <label
                      className="d-flex align-items-center gap-1 mb-0 fw-normal"
                      style={{ fontSize: '1.3rem', cursor: 'pointer' }}
                      title={t('questionBlock.multipleCorrectHint')}
                    >
                      <input
                        type="checkbox"
                        checked={isMsq}
                        onChange={(e) => toggleMsq(e.target.checked)}
                      />
                      {t('questionBlock.multipleCorrect')}
                    </label>
                  </div>
                </Col>

                {formData.options.map((opt, idx) => (
                  <Col md={6} key={idx} className="mb-2">
                    <div className={cxCreate('answerItem')}>
                      <input
                        type={isMsq ? 'checkbox' : 'radio'}
                        name="question-correct-answer"
                        checked={opt.isCorrect}
                        onChange={(e) =>
                          handleOptionChange(
                            idx,
                            'isCorrect',
                            isMsq ? e.target.checked : true,
                          )
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
                        placeholder={t('editQuestion.answerPlaceholder', { label: opt.answerLabel })}
                      />
                      <ButtonPrime
                        variant="dangerGhost"
                        size="icon"
                        className="ms-2"
                        onClick={() => removeAnswer(idx)}
                        disabled={formData.options.length <= 2}
                        aria-label={t('questionBlock.removeAnswer', { label: opt.answerLabel })}
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
                    {t('questionBlock.addAnswer')}
                  </ButtonPrime>
                </Col>

                <Col md={12} className="mt-3">
                  <div className={cx('sectionTitle')}>
                    {t('questionBlock.explanation')}
                  </div>
                  <textarea
                    className={cxCreate('inputModern', 'explanationTextarea')}
                    rows={6}
                    value={formData.explanation}
                    onChange={(e) =>
                      setFormData({ ...formData, explanation: e.target.value })
                    }
                    placeholder={t('questionBlock.explanationPlaceholder')}
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
        title={t('editQuestion.confirmDeleteMediaTitle')}
        message={t('editQuestion.confirmDeleteMediaMessage')}
      />
    </>
  );
};

export default EditQuestionModal;
