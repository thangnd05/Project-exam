import { useEffect, useRef } from 'react';
import {Spinner, Alert} from 'react-bootstrap';
import BaseModal from '~/shared/ui/modal/BaseModal';
import ButtonPrime from '~/shared/ui/Button/ButtonPrime';
import {toast} from 'react-toastify';
import {useQuestionDetail} from './hooks/useQuestionDetail';
import classNames from 'classnames/bind';
import {
  IoCloseOutline,
  IoCheckmarkCircle,
} from 'react-icons/io5';
import styles from './EditQuestionModal.module.scss';
import createStyles from '~/shared/test/CreateTestModal.module.scss';

const cx = classNames.bind(styles);
const cxCreate = classNames.bind(createStyles);

const collectMediaItems = (questionDetail) => {
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
      id: null,
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

const ViewQuestionModal = ({show, onHide, questionId}) => {
  const onHideRef = useRef(onHide);

  useEffect(() => {
    onHideRef.current = onHide;
  }, [onHide]);

  const {question, isLoading: loading, isError} = useQuestionDetail(questionId, {
    enabled: !!show,
  });

  useEffect(() => {
    if (isError) {
      toast.error('Không thể tải dữ liệu câu hỏi');
      onHideRef.current?.();
    }
  }, [isError]);

  const answers = Array.isArray(question?.answers) ? question.answers : [];
  const mediaItems = collectMediaItems(question);
  const passageContent = question?.passage?.content || '';
  const passageTranslation = question?.passage?.contentTranslation || '';
  const extraTexts = (Array.isArray(question?.passageMedia) ? question.passageMedia : [])
    .filter((m) => (m?.mediaType || '').toUpperCase() === 'TEXT')
    .map((m) => m?.content || '')
    .filter(Boolean);

  return (
    <BaseModal
      show={show}
      onClose={onHide}
      title="Chi tiết câu hỏi"
      maxWidth={800}
      footer={
        <ButtonPrime variant="ghost" size="lg" onClick={onHide}>
          <IoCloseOutline size={20} className="me-1" /> Đóng
        </ButtonPrime>
      }
    >
      <div className={cx('modalBody')}>
        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" />
            <p className="mt-2 text-muted">Đang tải dữ liệu...</p>
          </div>
        ) : !question ? (
          <Alert variant="info" className="mb-0">
            Không có dữ liệu để hiển thị.
          </Alert>
        ) : (
          <div className={cxCreate('partBlock')}>
            <div className={cx('sectionTitle')}>Nội dung câu hỏi</div>
            <div
              style={{
                background: 'var(--bg-white)',
                border: '1px solid var(--border-color)',
                borderRadius: 12,
                padding: '12px 14px',
                fontSize: 'var(--font-size-ssm)',
                color: 'var(--text-color)',
                whiteSpace: 'pre-wrap',
                marginBottom: 16,
              }}
            >
              {question.questionText || '(Không có nội dung)'}
            </div>

            {(passageContent || passageTranslation || mediaItems.length > 0 || extraTexts.length > 0) && (
              <>
                <div className={cx('sectionTitle')}>Đoạn văn / Media</div>

                {passageContent && (
                  <div
                    style={{
                      background: 'var(--bg-white)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 12,
                      padding: '12px 14px',
                      fontSize: 'var(--font-size-smd)',
                      color: 'var(--dark-color)',
                      whiteSpace: 'pre-wrap',
                      marginBottom: 12,
                    }}
                  >
                    {passageContent}
                  </div>
                )}

                {extraTexts.map((text, idx) => (
                  <div
                    key={`extra-${idx}`}
                    style={{
                      background: 'var(--bg-white)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 12,
                      padding: '12px 14px',
                      fontSize: 'var(--font-size-smd)',
                      color: 'var(--dark-color)',
                      whiteSpace: 'pre-wrap',
                      marginBottom: 12,
                    }}
                  >
                    {text}
                  </div>
                ))}

                {passageTranslation && (
                  <details style={{ marginBottom: 12 }}>
                    <summary style={{ cursor: 'pointer', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>
                      Bản dịch
                    </summary>
                    <div
                      style={{
                        background: 'var(--input-bg)',
                        border: '1px dashed var(--border-color)',
                        borderRadius: 12,
                        padding: '12px 14px',
                        fontSize: 'var(--font-size-smd)',
                        color: 'var(--text-secondary)',
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      {passageTranslation}
                    </div>
                  </details>
                )}

                {mediaItems.length > 0 && (
                  <div className={cx('existingMediaList')}>
                    {mediaItems.map((item, idx) => {
                      const url = item.mediaUrl;
                      const isAudio =
                        item.mediaType === 'AUDIO' ||
                        /\.(mp3|wav|ogg|m4a)(\?.*)?$/i.test(url);
                      const isImage =
                        item.mediaType === 'IMAGE' ||
                        /\.(png|jpe?g|gif|webp|svg)(\?.*)?$/i.test(url);

                      return (
                        <div
                          key={`${item.id || url}-${idx}`}
                          className={cx('existingMediaCard')}
                        >
                          <div className={cx('existingMediaMeta')}>
                            <span>
                              {isAudio
                                ? 'Audio'
                                : isImage
                                  ? 'Ảnh'
                                  : 'Tài liệu'}{' '}
                              ·{' '}
                              <a href={url} target="_blank" rel="noreferrer">
                                Mở file
                              </a>
                            </span>
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
                )}
              </>
            )}

            <div className={cx('sectionTitle')}>Đáp án</div>
            {answers.length === 0 ? (
              <Alert variant="info" className="mb-0">
                Câu hỏi này chưa có đáp án.
              </Alert>
            ) : (
              <div style={{display: 'flex', flexDirection: 'column', gap: 8}}>
                {answers.map((ans, idx) => {
                  const label =
                    ans.answerLabel || String.fromCharCode(65 + idx);
                  const text = ans.answerText || ans.content || '';
                  const isCorrect = !!ans.isCorrect;
                  return (
                    <div
                      key={ans.answerId || ans.id || idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '10px 12px',
                        borderRadius: 10,
                        border: `1px solid ${isCorrect ? 'var(--success-border)' : 'var(--border-color)'}`,
                        background: isCorrect ? 'var(--success-bg)' : 'var(--bg-white)',
                        fontSize: 'var(--font-size-smd)',
                      }}
                    >
                      <span style={{fontWeight: 700, minWidth: 22}}>
                        {label}.
                      </span>
                      <span style={{flex: 1, color: 'var(--text-color)'}}>
                        {text || '(Trống)'}
                      </span>
                      {isCorrect && (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            color: 'var(--success-text)',
                            fontWeight: 700,
                          }}
                        >
                          <IoCheckmarkCircle size={20} /> Đáp án đúng
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {question?.explanation?.trim() && (
              <>
                <div className={cx('sectionTitle')} style={{ marginTop: 16 }}>
                  Giải thích đáp án
                </div>
                <div
                  style={{
                    padding: '12px 14px',
                    borderRadius: 10,
                    border: '1px solid var(--border-color)',
                    background: 'var(--input-bg)',
                    fontSize: 'var(--font-size-smd)',
                    color: 'var(--text-color)',
                    whiteSpace: 'pre-wrap',
                    lineHeight: 1.5,
                  }}
                >
                  {question.explanation}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </BaseModal>
  );
};

export default ViewQuestionModal;
