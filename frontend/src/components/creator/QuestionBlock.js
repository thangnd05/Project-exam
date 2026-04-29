import React from 'react';
import { Row, Col, Button } from 'react-bootstrap';
import { Trash } from 'lucide-react';
import classNames from 'classnames/bind';
import styles from '../modals/CreateTestModal.module.scss';

const cx = classNames.bind(styles);

const ACCEPT_MEDIA = 'image/*,audio/*';

const QuestionBlock = ({
    question,
    index,
    removeQuestionFn,
    updateQuestionTextFn,
    updateQuestionFieldFn,
    updateAnswerFn,
    addMediaFilesFn,
    removeMediaFileFn,
    setPassageTypeFn,
    withMedia = true,
    minQuestions = 1,
}) => {
    return (
        <div className={cx('partBlock')}>
            <div className="d-flex justify-content-between align-items-center mb-2">
                <b>Câu hỏi số {index + 1}</b>
                <Button
                    variant="link"
                    className="text-danger p-0"
                    onClick={() => removeQuestionFn(index)}
                    disabled={minQuestions <= 1}
                >
                    <Trash size={18} />
                </Button>
            </div>
            <input
                className={cx('inputModern', 'mb-3')}
                placeholder="Nhập nội dung câu hỏi..."
                value={question.questionText}
                onChange={(e) => updateQuestionTextFn(index, e.target.value)}
            />
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
                                type="radio"
                                name={`q-${index}`}
                                checked={ans.isCorrect}
                                onChange={() => updateAnswerFn(index, aIndex, 'isCorrect', true)}
                            />
                            <span className="ms-2 fw-bold">{ans.answerLabel}.</span>
                            <input
                                className={cx('inputModern', 'ms-2')}
                                value={ans.answerText}
                                placeholder={`Đáp án ${ans.answerLabel}`}
                                onChange={(e) => updateAnswerFn(index, aIndex, 'answerText', e.target.value)}
                            />
                        </div>
                    </Col>
                ))}
            </Row>
        </div>
    );
};

export default QuestionBlock;
