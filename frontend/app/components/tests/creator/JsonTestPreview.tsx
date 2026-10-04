'use client';

import { useState } from 'react';
import { Alert } from 'react-bootstrap';
import { IoBookOutline, IoChevronDownOutline, IoChevronUpOutline } from 'react-icons/io5';
import classNames from 'classnames/bind';
import ButtonPrime from '@/app/components/Button/ButtonPrime';
import TagSelector from '@/app/components/TagSelector/TagSelector';
import type { NormalQuestionRequest, TestJsonImportPreviewResponse } from '@/app/types';
import styles from '../CreateTestModal.module.scss';

const cx = classNames.bind(styles);

// Đề lớn thì gập sẵn các phần thi để không render cả nghìn câu một lúc.
const AUTO_EXPAND_LIMIT = 100;

type JsonTestPreviewProps = {
  preview: TestJsonImportPreviewResponse & { fileName: string };
  onClear: () => void;
  /** Tag của loại kỳ thi, để hiện tag của câu theo đúng giao diện chọn tag khi thêm câu vào kho. */
  availableTags: any[];
};

const norm = (s?: string | null) => (s || '').trim().toLowerCase();

/** Đối chiếu tag trong file với tag có trong hệ thống của phần thi; trả về id khớp và tên không khớp. */
const resolveTags = (question: NormalQuestionRequest, partTags: any[]) => {
  const ids: string[] = [...(question.tagIds || [])];
  const unmatched: string[] = [];
  (question.tagNames || []).forEach((spec) => {
    const tag = partTags.find((t) => norm(t.name) === norm(shortTag(spec)));
    if (tag) {
      if (!ids.includes(tag.tagId)) ids.push(tag.tagId);
    } else {
      unmatched.push(spec);
    }
  });
  return { ids, unmatched };
};

/** Tag dạng "Phần thi > Tag": phần thi đã là tiêu đề thẻ nên chỉ hiện tên tag. */
const shortTag = (spec: string) => {
  const gt = spec.indexOf('>');
  return gt >= 0 ? spec.slice(gt + 1).trim() : spec;
};

type QuestionItemProps = {
  question: NormalQuestionRequest;
  number: number;
  partName: string;
  partTags: any[];
};

const QuestionItem = ({ question, number, partName, partTags }: QuestionItemProps) => {
  const [showExplanation, setShowExplanation] = useState(false);
  const { ids, unmatched } = resolveTags(question, partTags);
  return (
    <li className={cx('bankQuestionItem', 'jsonQuestionItem')}>
      <span className={cx('bankQuestionIndex')}>{number}.</span>
      <div className={cx('jsonQuestionBody')}>
        <div className={cx('bankQuestionText')}>
          {question.questionType === 'MSQ' && <span className={cx('jsonTypeBadge')}>Chọn nhiều</span>}
          {question.questionText}
        </div>
        <ul className={cx('jsonAnswerList')}>
          {(question.answers || []).map((a) => (
            <li key={a.answerLabel} className={cx('jsonAnswer', { correct: a.isCorrect })}>
              <strong>{a.answerLabel}.</strong> {a.answerText}
            </li>
          ))}
        </ul>
        <div className={cx('jsonQuestionTags')}>
          <TagSelector tags={partTags} selectedIds={ids} label={`Tag phân loại · ${partName}`} />
          {unmatched.length > 0 && (
            <div className={cx('jsonQuestionMeta')}>
              {unmatched.map((t) => (
                <span key={t} className={cx('jsonTagChip', 'missing')} title="Tag chưa có trong hệ thống, sẽ bị bỏ qua khi tạo đề">
                  {shortTag(t)} (chưa có)
                </span>
              ))}
            </div>
          )}
        </div>
        <div className={cx('jsonQuestionMeta')}>
          {question.explanation && (
            <button type="button" className={cx('jsonExplainToggle')} onClick={() => setShowExplanation((v) => !v)}>
              {showExplanation ? 'Ẩn lời giải' : 'Xem lời giải'}
            </button>
          )}
        </div>
        {showExplanation && <div className={cx('jsonExplanation')}>{question.explanation}</div>}
      </div>
    </li>
  );
};

const JsonTestPreview = ({ preview, onClear, availableTags }: JsonTestPreviewProps) => {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const expandByDefault = preview.questionCount <= AUTO_EXPAND_LIMIT;

  if (!preview.valid) {
    return (
      <Alert variant="danger">
        <strong>File có {preview.errors.length} lỗi, chưa thể tạo đề:</strong>
        <ul className="mb-0">
          {preview.errors.slice(0, 30).map((err, i) => <li key={i}>{err}</li>)}
        </ul>
        {preview.errors.length > 30 && <small>... và {preview.errors.length - 30} lỗi khác.</small>}
      </Alert>
    );
  }

  // Đánh số liên tục cả đề, giống thứ tự người làm bài sẽ thấy.
  let number = 0;

  return (
    <>
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
        <span>
          <strong>{preview.questionCount}</strong> câu, chia vào <strong>{preview.parts.length}</strong> phần thi.
          Đề chỉ lấy câu từ file này.
        </span>
        <ButtonPrime type="button" variant="outline" size="md" onClick={onClear}>
          Bỏ file JSON, nhập tay
        </ButtonPrime>
      </div>

      {preview.warnings.length > 0 && (
        <Alert variant="warning" className="mb-3">
          <strong>Cảnh báo ({preview.warnings.length}):</strong>
          <ul className="mb-0">
            {preview.warnings.slice(0, 20).map((w, i) => <li key={i}>{w}</li>)}
          </ul>
          {preview.warnings.length > 20 && <small>... và {preview.warnings.length - 20} cảnh báo khác.</small>}
        </Alert>
      )}

      {preview.parts.map((part) => {
        const isOpen = expanded[part.examPartId] ?? expandByDefault;
        const startNumber = number;
        number += part.questionCount;
        let local = startNumber;
        // Tag thuộc phần thi này cộng tag dùng chung, giống danh sách tag khi thêm câu vào kho của phần thi đó.
        const partTags = availableTags.filter((t) => !t.examPartId || t.examPartId === part.examPartId);
        return (
          <div key={part.examPartId} className={cx('bankPartCard')}>
            <button
              type="button"
              className={cx('bankPartHeader')}
              onClick={() => setExpanded((prev) => ({ ...prev, [part.examPartId]: !isOpen }))}
              aria-expanded={isOpen}
            >
              <span className={cx('bankPartName')}>
                <IoBookOutline size={20} /> {part.examPartName}
              </span>
              <span className={cx('bankPartBadge')}>{part.questionCount} câu</span>
              {isOpen ? <IoChevronUpOutline size={22} /> : <IoChevronDownOutline size={22} />}
            </button>
            {isOpen && (
              <div className={cx('bankPartBody')}>
                <ul className={cx('bankQuestionList', 'jsonQuestionList')}>
                  {part.questions.map((q, i) => (
                    <QuestionItem key={`q-${i}`} question={q} number={++local} partName={part.examPartName} partTags={partTags} />
                  ))}
                </ul>
                {part.groups.map((g, gi) => (
                  <div key={`g-${gi}`} className={cx('jsonPassageGroup')}>
                    <div className={cx('bankGroupLabel')}>Nhóm đoạn văn ({g.questions?.length ?? 0} câu)</div>
                    {g.passage?.content && <div className={cx('jsonPassageContent')}>{g.passage.content}</div>}
                    <ul className={cx('bankQuestionList', 'jsonQuestionList')}>
                      {(g.questions || []).map((q, i) => (
                        <QuestionItem key={`g-${gi}-${i}`} question={q} number={++local} partName={part.examPartName} partTags={partTags} />
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </>
  );
};

export default JsonTestPreview;
