import React, {useEffect, useRef, useState} from 'react';
import {Modal, Button, Spinner, Alert} from 'react-bootstrap';
import { getQuestionById } from '~/api/questionApi';
import {toast} from 'react-toastify';
import classNames from 'classnames/bind';
import {
  IoCloseOutline,
  IoEyeOutline,
  IoCheckmarkCircle,
} from 'react-icons/io5';
import styles from './EditQuestionModal.module.scss';
import createStyles from '~/components/test/CreateTestModal.module.scss';

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
  const [loading, setLoading] = useState(false);
  const [question, setQuestion] = useState(null);
  const onHideRef = useRef(onHide);

  useEffect(() => {
    onHideRef.current = onHide;
  }, [onHide]);

  useEffect(() => {
    if (!show || !questionId) return;
    let cancelled = false;

    const fetchDetail = async (id) => {
      setLoading(true);
      try {
        const data = await getQuestionById(id);
        if (!cancelled) {
          setQuestion(data);
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

    setQuestion(null);
    fetchDetail(questionId);

    return () => {
      cancelled = true;
    };
  }, [show, questionId]);

  const answers = Array.isArray(question?.answers) ? question.answers : [];
  const mediaItems = collectMediaItems(question);
  const passageContent = question?.passage?.content || '';

  return (
    <Modal
      show={show}
      onHide={onHide}
      size="lg"
      centered
      className={cx('modalWrapper', 'questionModalRoot')}
      backdropClassName={cx('questionBackdrop')}
    >
      <div className={cxCreate('header')}>
        <div className={cxCreate('titleWrapper')}>
          <IoEyeOutline />
          <h3 className={cxCreate('title')}>Chi tiết câu hỏi</h3>
        </div>
        <button
          type="button"
          className={cxCreate('closeBtn')}
          onClick={onHide}
          aria-label="Đóng"
        >
          <IoCloseOutline />
        </button>
      </div>

      <Modal.Body className={cx('modalBody')}>
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
                background: '#fff',
                border: '2px solid #e2e8f0',
                borderRadius: 12,
                padding: '12px 14px',
                fontSize: '1.4rem',
                color: '#0f172a',
                whiteSpace: 'pre-wrap',
                marginBottom: 16,
              }}
            >
              {question.questionText || '(Không có nội dung)'}
            </div>

            {(passageContent || mediaItems.length > 0) && (
              <>
                <div className={cx('sectionTitle')}>Đoạn văn / Media</div>

                {passageContent && (
                  <div
                    style={{
                      background: '#fff',
                      border: '2px solid #e2e8f0',
                      borderRadius: 12,
                      padding: '12px 14px',
                      fontSize: '1.3rem',
                      color: '#1e293b',
                      whiteSpace: 'pre-wrap',
                      marginBottom: 12,
                    }}
                  >
                    {passageContent}
                  </div>
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
                        border: `2px solid ${isCorrect ? '#16a34a' : '#e2e8f0'}`,
                        background: isCorrect ? '#f0fdf4' : '#fff',
                        fontSize: '1.35rem',
                      }}
                    >
                      <span style={{fontWeight: 800, minWidth: 22}}>
                        {label}.
                      </span>
                      <span style={{flex: 1, color: '#0f172a'}}>
                        {text || '(Trống)'}
                      </span>
                      {isCorrect && (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            color: '#16a34a',
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
                    border: '2px solid #fbbf24',
                    background: '#fffbeb',
                    fontSize: '1.05rem',
                    color: '#92400e',
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
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          <IoCloseOutline size={20} className="me-1" /> Đóng
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ViewQuestionModal;
