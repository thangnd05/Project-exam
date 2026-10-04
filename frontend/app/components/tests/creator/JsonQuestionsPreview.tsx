'use client';

import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Alert } from 'react-bootstrap';
import { IoBookOutline, IoChevronDownOutline, IoChevronUpOutline } from 'react-icons/io5';
import classNames from 'classnames/bind';
import ButtonPrime from '@/app/components/Button/ButtonPrime';
import type { NormalQuestionRequest, PassageQuestionGroupRequest } from '@/app/types';
import type { DraftQuestion } from '@/app/hooks/useCreateTest';
import Pager, { PAGE_SIZE, pageCountOf } from './Pager';
import QuestionBlock from './QuestionBlock';
import { TAG_STATUS_LABEL, previewTagStatus, resolveQuestionTags, shortTag } from './tagStatus';
import type { TagStatus } from './tagStatus';
import { fromDraftQuestion, toDraftQuestion } from './jsonPreviewEdit';
import type { PreviewLocation } from './jsonPreviewEdit';
import styles from '../CreateTestModal.module.scss';

const cx = classNames.bind(styles);

// Nhiều phần thi và đề lớn thì gập sẵn, để mở trang không phải vẽ mọi thẻ.
const AUTO_EXPAND_LIMIT = 100;
const MIN_ANSWERS = 2;
const MAX_ANSWERS = 10;

export type PreviewPart = {
  key: string;
  name: string;
  questions: NormalQuestionRequest[];
  groups: PassageQuestionGroupRequest[];
};

/** Sửa (hoặc xoá khi {@code question} null) một câu trong bản xem trước. */
export type EditQuestionHandler = (partKey: string, loc: PreviewLocation, question: NormalQuestionRequest | null) => void;

type PreviewQuestion = { question: NormalQuestionRequest; number: number; status: TagStatus; loc: PreviewLocation };

/** Một đơn vị phân trang: câu độc lập, hoặc cả nhóm đoạn văn (không tách nhóm sang hai trang). */
type Block =
  | { kind: 'question'; item: PreviewQuestion }
  | { kind: 'group'; group: PassageQuestionGroupRequest; items: PreviewQuestion[] };

const blockHasIssue = (block: Block) =>
  block.kind === 'question'
    ? block.item.status !== 'ok'
    : block.items.some((i) => i.status !== 'ok');

const relabel = (answers: DraftQuestion['answers']) =>
  answers.map((a, i) => ({ ...a, answerLabel: String.fromCharCode(65 + i) }));

type EditableQuestionProps = {
  item: PreviewQuestion;
  partKey: string;
  partTags: any[];
  canRemove: boolean;
  onChange: (question: NormalQuestionRequest | null) => void;
};

/** Khung soạn thảo như khi nhập tay: sửa trực tiếp trên ô, thùng rác ở góc để xoá câu. */
const EditableQuestion = ({ item, partKey, partTags, canRemove, onChange }: EditableQuestionProps) => {
  const draft = toDraftQuestion(item.question, partTags);
  const commit = (patch: Partial<DraftQuestion>) => onChange(fromDraftQuestion({ ...draft, ...patch }, item.question));
  const { unmatched } = resolveQuestionTags(item.question, partTags);
  const warning = item.status === 'ok'
    ? null
    : item.status === 'unmatched'
      ? `${TAG_STATUS_LABEL.unmatched}: ${unmatched.map(shortTag).join(', ')}`
      : TAG_STATUS_LABEL.missing;

  return (
    <div className={cx('jsonEditableQuestion', { hasTagIssue: item.status !== 'ok' })}>
      <QuestionBlock
        question={draft}
        index={item.number - 1}
        radioGroupPrefix={`json-${partKey}-${item.number}`}
        withMedia={false}
        minQuestions={canRemove ? 2 : 1}
        availableTags={partTags}
        tagWarning={warning}
        removeQuestionFn={() => onChange(null)}
        updateQuestionTextFn={(_, value) => commit({ questionText: value })}
        updateQuestionFieldFn={(_, field, value) => {
          if (field === 'questionType' && value === 'MCQ') {
            // Về một đáp án đúng: giữ đáp án đúng đầu tiên.
            const first = draft.answers.findIndex((a) => a.isCorrect);
            commit({ questionType: value, answers: draft.answers.map((a, i) => ({ ...a, isCorrect: i === first })) });
            return;
          }
          if (field === 'tagIds') {
            // Đã chọn lại tag bằng tay: bỏ các tên tag không khớp còn sót từ file.
            commit({ tagIds: value, tagNames: [] });
            return;
          }
          commit({ [field]: value } as Partial<DraftQuestion>);
        }}
        updateAnswerFn={(_, aIndex, field, value) => {
          const answers = field === 'isCorrect'
            ? draft.answers.map((a, i) => (draft.questionType === 'MSQ'
              ? (i === aIndex ? { ...a, isCorrect: value } : a)
              : { ...a, isCorrect: i === aIndex }))
            : draft.answers.map((a, i) => (i === aIndex ? { ...a, [field]: value } : a));
          commit({ answers });
        }}
        addAnswerFn={() => {
          if (draft.answers.length >= MAX_ANSWERS) return;
          commit({ answers: relabel([...draft.answers, { answerLabel: '', answerText: '', isCorrect: false }]) });
        }}
        removeAnswerFn={(_, aIndex) => {
          if (draft.answers.length <= MIN_ANSWERS) return;
          commit({ answers: relabel(draft.answers.filter((_, i) => i !== aIndex)) });
        }}
        addMediaFilesFn={() => {}}
        removeMediaFileFn={() => {}}
      />
    </div>
  );
};

type JsonQuestionsPreviewProps = {
  valid: boolean;
  errors: string[];
  warnings: string[];
  parts: PreviewPart[];
  /** Tag của loại kỳ thi; mỗi thẻ chỉ dùng tag của phần thi đó cộng tag dùng chung. */
  availableTags: any[];
  summary: ReactNode;
  onClear: () => void;
  clearLabel: string;
  onEditQuestion: EditQuestionHandler;
};

/**
 * Câu hỏi nạp từ file JSON: sửa trực tiếp như khung nhập tay, chia theo phần thi, phân trang
 * (chỉ vẽ 20 câu mỗi lần nên file nghìn câu không giật) và báo câu thiếu tag.
 */
const JsonQuestionsPreview = ({
  valid,
  errors,
  warnings,
  parts,
  availableTags,
  summary,
  onClear,
  clearLabel,
  onEditQuestion,
}: JsonQuestionsPreviewProps) => {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [pages, setPages] = useState<Record<string, number>>({});
  const [issuesOnly, setIssuesOnly] = useState(false);

  // Đánh số liên tục cả file, giống thứ tự sẽ lưu; tính trạng thái tag một lần cho mọi câu.
  const prepared = useMemo(() => {
    let number = 0;
    return parts.map((part) => {
      const partTags = availableTags.filter((t) => !t.examPartId || t.examPartId === part.key);
      const toItem = (question: NormalQuestionRequest, loc: PreviewLocation): PreviewQuestion => ({
        question,
        number: ++number,
        status: previewTagStatus(question, partTags),
        loc,
      });
      const blocks: Block[] = [
        ...part.questions.map((q, index) => ({ kind: 'question' as const, item: toItem(q, { groupIndex: null, index }) })),
        ...part.groups.map((g, groupIndex) => ({
          kind: 'group' as const,
          group: g,
          items: (g.questions || []).map((q, index) => toItem(q, { groupIndex, index })),
        })),
      ];
      return { part, partTags, blocks };
    });
  }, [parts, availableTags]);

  const counts = useMemo(() => {
    const c = { total: 0, ok: 0, missing: 0, unmatched: 0 };
    prepared.forEach(({ blocks }) => blocks.forEach((b) => {
      (b.kind === 'question' ? [b.item] : b.items).forEach((i) => {
        c.total++;
        c[i.status]++;
      });
    }));
    return c;
  }, [prepared]);

  if (!valid) {
    return (
      <Alert variant="danger">
        <strong>File có {errors.length} lỗi, chưa thể lưu:</strong>
        <ul className="mb-0">
          {errors.slice(0, 30).map((err, i) => <li key={i}>{err}</li>)}
        </ul>
        {errors.length > 30 && <small>... và {errors.length - 30} lỗi khác.</small>}
      </Alert>
    );
  }

  const issueCount = counts.missing + counts.unmatched;
  const expandByDefault = parts.length === 1 || counts.total <= AUTO_EXPAND_LIMIT;

  return (
    <>
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
        <span>{summary}</span>
        <ButtonPrime type="button" variant="outline" size="md" onClick={onClear}>
          {clearLabel}
        </ButtonPrime>
      </div>

      <div className={cx('tagSummaryBar', { hasIssue: issueCount > 0 })}>
        <span className={cx('tagSummaryItem', 'ok')}>✓ {counts.ok}/{counts.total} câu có tag</span>
        {counts.missing > 0 && (
          <span className={cx('tagSummaryItem', 'warn')}>⚠ {counts.missing} câu chưa có tag</span>
        )}
        {counts.unmatched > 0 && (
          <span className={cx('tagSummaryItem', 'danger')}>⚠ {counts.unmatched} câu có tag không khớp hệ thống</span>
        )}
        {(issueCount > 0 || issuesOnly) && (
          <button
            type="button"
            className={cx('tagFilterBtn')}
            onClick={() => {
              setIssuesOnly((v) => !v);
              setPages({});
            }}
          >
            {issuesOnly ? 'Hiện tất cả câu' : `Chỉ hiện ${issueCount} câu cần sửa tag`}
          </button>
        )}
      </div>
      {issueCount > 0 && (
        <small className="text-muted d-block mb-3">
          Câu thiếu tag vẫn lưu được nhưng không tính vào điểm theo tag và không sinh ải học trong lộ trình.
          Chọn tag ngay trên câu bên dưới.
        </small>
      )}

      {warnings.length > 0 && (
        <Alert variant="warning" className="mb-3">
          <strong>Cảnh báo ({warnings.length}):</strong>
          <ul className="mb-0">
            {warnings.slice(0, 20).map((w, i) => <li key={i}>{w}</li>)}
          </ul>
          {warnings.length > 20 && <small>... và {warnings.length - 20} cảnh báo khác.</small>}
        </Alert>
      )}

      {prepared.map(({ part, partTags, blocks }) => {
        const visible = issuesOnly ? blocks.filter(blockHasIssue) : blocks;
        if (issuesOnly && visible.length === 0) return null;
        const partQuestionCount = blocks.reduce((n, b) => n + (b.kind === 'question' ? 1 : b.items.length), 0);
        const partIssues = blocks.reduce(
          (n, b) => n + (b.kind === 'question' ? [b.item] : b.items).filter((i) => i.status !== 'ok').length, 0);
        const isOpen = issuesOnly || (expanded[part.key] ?? expandByDefault);
        const pageCount = pageCountOf(visible.length);
        const page = Math.min(pages[part.key] ?? 0, pageCount - 1);
        const pageBlocks = visible.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
        const setPage = (p: number) => setPages((prev) => ({ ...prev, [part.key]: p }));
        const renderQuestion = (item: PreviewQuestion) => (
          <EditableQuestion
            key={`${item.loc.groupIndex ?? 'q'}-${item.loc.index}`}
            item={item}
            partKey={part.key}
            partTags={partTags}
            canRemove={counts.total > 1}
            onChange={(q) => onEditQuestion(part.key, item.loc, q)}
          />
        );

        return (
          <div key={part.key} className={cx('bankPartCard')}>
            <button
              type="button"
              className={cx('bankPartHeader')}
              onClick={() => setExpanded((prev) => ({ ...prev, [part.key]: !isOpen }))}
              aria-expanded={isOpen}
            >
              <span className={cx('bankPartName')}>
                <IoBookOutline size={20} /> {part.name}
              </span>
              <span className="d-flex align-items-center gap-2">
                {partIssues > 0 && <span className={cx('tagWarningBadge')}>⚠ {partIssues} câu thiếu/sai tag</span>}
                <span className={cx('bankPartBadge')}>{partQuestionCount} câu</span>
              </span>
              {isOpen ? <IoChevronUpOutline size={22} /> : <IoChevronDownOutline size={22} />}
            </button>
            {isOpen && (
              <div className={cx('bankPartBody')}>
                <Pager page={page} pageCount={pageCount} onChange={setPage} />
                {pageBlocks.map((block) => (block.kind === 'question' ? renderQuestion(block.item) : (
                  <div key={`g-${block.items[0]?.loc.groupIndex}`} className={cx('jsonPassageGroup')}>
                    <div className={cx('bankGroupLabel')}>Nhóm đoạn văn ({block.items.length} câu)</div>
                    {block.group.passage?.content && (
                      <div className={cx('jsonPassageContent')}>{block.group.passage.content}</div>
                    )}
                    {block.items.map(renderQuestion)}
                  </div>
                )))}
                <Pager page={page} pageCount={pageCount} onChange={setPage} />
              </div>
            )}
          </div>
        );
      })}
    </>
  );
};

export default JsonQuestionsPreview;
