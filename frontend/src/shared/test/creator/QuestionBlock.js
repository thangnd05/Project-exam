import React from 'react';
import { Row, Col, Button } from 'react-bootstrap';
import { PlusCircle, Trash, ChevronDown, ChevronRight } from 'lucide-react';
import classNames from 'classnames/bind';
import styles from '../CreateTestModal.module.scss';
import TagSelector from '~/shared/ui/TagSelector/TagSelector';

const cx = classNames.bind(styles);

const ACCEPT_MEDIA = 'image/*,audio/*';

const getQuestionSummary = (question) => {
    const text = (question.questionText || '').trim();
    const preview = text
        ? (text.length > 60 ? `${text.slice(0, 60)}…` : text)
        : 'Chưa có nội dung';
    const answers = question.answers || [];
    const correctCount = answers.filter((a) => a.isCorrect).length;
    const parts = [preview, `${answers.length} đáp án`];
    if (correctCount > 0) {
        parts.push(`${correctCount} đúng`);
    }
    return parts.join(' · ');
};

const QuestionBlock = ({
    question,
    index,
    removeQuestionFn,
    updateQuestionTextFn,
    updateQuestionFieldFn,
    updateAnswerFn,
    addAnswerFn,
    removeAnswerFn,
    addMediaFilesFn,
    removeMediaFileFn,
    setPassageTypeFn,
    availableTags = [],
    withMedia = true,
    minQuestions = 1,
    radioGroupPrefix = 'q',
    collapsible = false,
    isCollapsed = false,
    onToggleCollapsed,
}) => {
    const selectedTagIds = question.tagIds || [];
    const isMsq = question.questionType === 'MSQ';
    const collapsed = collapsible && isCollapsed;
    return (
        <div className={cx('partBlock', { collapsed })}>
            <div className={collapsible ? cx('groupHeader') : 'd-flex justify-content-between align-items-center mb-2'}>
                {collapsible ? (
                    <button
                        type="button"
                        className={cx('groupToggleBtn')}
                        onClick={() => onToggleCollapsed?.(index)}
                        aria-expanded={!isCollapsed}
                        aria-label={isCollapsed ? `Mở câu hỏi số ${index + 1}` : `Thu gọn câu hỏi số ${index + 1}`}
                    >
                        {isCollapsed ? <ChevronRight size={20} /> : <ChevronDown size={20} />}
                        <h4 className={cx('groupTitle')}>Câu hỏi số {index + 1}</h4>
                        <span className={cx('groupSummaryBadge')}>{getQuestionSummary(question)}</span>
                    </button>
                ) : (
                    <b>Câu hỏi số {index + 1}</b>
                )}
                <div className="d-flex align-items-center gap-3">
                    <label className="d-flex align-items-center gap-1 mb-0" style={{ fontSize: '1.3rem', cursor: 'pointer' }} title="Cho phép nhiều đáp án đúng (chấm đúng-hết)">
                        <input
                            type="checkbox"
                            checked={isMsq}
                            onChange={(e) =>
                                updateQuestionFieldFn?.(index, 'questionType', e.target.checked ? 'MSQ' : 'MCQ')
                            }
                        />
                        Nhiều đáp án đúng
                    </label>
                    <Button
                        variant="link"
                        className="text-danger p-0"
                        onClick={() => removeQuestionFn(index)}
                        disabled={minQuestions <= 1}
                    >
                        <Trash size={18} />
                    </Button>
                </div>
            </div>

            {!collapsed && (
            <>
            <input
                className={cx('inputModern', 'mb-3')}
                placeholder="Nhập nội dung câu hỏi..."
                value={question.questionText}
                onChange={(e) => updateQuestionTextFn(index, e.target.value)}
            />

            {availableTags.length > 0 && (
                <div className="mb-3">
                    <TagSelector
                        tags={availableTags}
                        selectedIds={selectedTagIds}
                        onToggle={(tagId) => {
                            const next = selectedTagIds.includes(tagId)
                                ? selectedTagIds.filter((id) => id !== tagId)
                                : [...selectedTagIds, tagId];
                            updateQuestionFieldFn?.(index, 'tagIds', next);
                        }}
                    />
                </div>
            )}
            {withMedia && (
                <div className="mb-3">
                    <label className="fw-bold mb-1 d-block">Phương tiện (nếu có)</label>
                    <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
                        <input
                            type="file"
                            multiple
                            accept={ACCEPT_MEDIA}
                            className={cx('inputModern')}
                            style={{ width: 'auto' }}
                            onChange={(e) => {
                                addMediaFilesFn(index, e.target.files);
                                e.target.value = '';
                            }}
                            aria-label="Thêm file"
                        />
                    </div>
                    <input
                        type="text"
                        className={cx('inputModern')}
                        placeholder="Hoặc điền URL phương tiện (audio/image/document)..."
                        value={question.mediaUrl || ''}
                        onChange={(e) => updateQuestionFieldFn?.(index, 'mediaUrl', e.target.value)}
                        aria-label="Điền URL phương tiện"
                    />
                    {question.mediaFiles?.length > 0 && (
                        <ul className="list-unstyled mb-0 mt-2">
                            {question.mediaFiles.map((file, fIdx) => (
                                <li key={fIdx} className="d-flex align-items-center gap-2 mb-1">
                                    <span className="small text-secondary">{file.name}</span>
                                    <button
                                        type="button"
                                        className="btn btn-sm btn-outline-danger p-0 px-1"
                                        onClick={() => removeMediaFileFn(index, fIdx)}
                                        aria-label={`Xóa ${file.name}`}
                                    >
                                        <Trash size={14} />
                                    </button>
                                    {file.type.startsWith('audio/') && (
                                        <audio controls className="flex-grow-1" style={{ maxHeight: 32 }}>
                                            <source src={URL.createObjectURL(file)} />
                                        </audio>
                                    )}
                                    {file.type.startsWith('image/') && (
                                        <img
                                            src={URL.createObjectURL(file)}
                                            alt={file.name}
                                            style={{ maxHeight: 40, objectFit: 'contain' }}
                                        />
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
            <Row className="g-2">
                {question.answers.map((ans, aIndex) => (
                    <Col md={6} key={aIndex}>
                        <div className={cx('answerItem')}>
                            <input
                                type={isMsq ? 'checkbox' : 'radio'}
                                name={`${radioGroupPrefix}-${index}`}
                                checked={ans.isCorrect}
                                onChange={(e) => updateAnswerFn(index, aIndex, 'isCorrect', isMsq ? e.target.checked : true)}
                            />
                            <span className="ms-2 fw-bold">{ans.answerLabel}.</span>
                            <input
                                className={cx('inputModern', 'ms-2')}
                                value={ans.answerText}
                                placeholder={`Đáp án ${ans.answerLabel}`}
                                onChange={(e) => updateAnswerFn(index, aIndex, 'answerText', e.target.value)}
                            />
                            <button
                                type="button"
                                className="btn btn-sm btn-outline-danger ms-2"
                                onClick={() => removeAnswerFn?.(index, aIndex)}
                                aria-label={`Xóa đáp án ${ans.answerLabel}`}
                            >
                                <Trash size={14} />
                            </button>
                        </div>
                    </Col>
                ))}
            </Row>
            <div className="mt-3">
                <button
                    type="button"
                    className={cx('btnSecondary')}
                    onClick={() => addAnswerFn?.(index)}
                >
                    <PlusCircle size={16} className="me-1" />
                    Thêm đáp án
                </button>
            </div>
            <div className="mt-3">
                <label className="fw-bold mb-1 d-block">Giải thích đáp án (không bắt buộc)</label>
                <textarea
                    className={cx('inputModern', 'explanationTextarea')}
                    rows={6}
                    placeholder="Nhập giải thích đáp án (hiển thị cho học sinh khi xem lại bài)..."
                    value={question.explanation || ''}
                    onChange={(e) => updateQuestionFieldFn?.(index, 'explanation', e.target.value)}
                />
            </div>
            </>
            )}
        </div>
    );
};

export default QuestionBlock;
