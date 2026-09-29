'use client';

import { useEffect, useMemo, useState } from 'react';
import classNames from 'classnames/bind';
import { toast } from 'react-toastify';
import { Edit, Trash2 } from 'lucide-react';

import {
  AdminPageHeader,
  AdminTable,
  AdminToolbar,
  StatCard,
  StatCardGroup,
} from '@/app/components/admin/common';
import type { AdminTableColumn } from '@/app/components/admin/common/AdminTable';
import ButtonPrime from '@/app/components/Button/ButtonPrime';
import ConfirmDeleteModal from '@/app/components/modal/ConfirmDeleteModal';
import EditQuestionModal from '@/app/components/tests/EditQuestionModal';
import { UNCLASSIFIED_COLLECTION } from '@/app/apis/questionApi';
import { useQuestionCollections } from '@/app/hooks/useQuestionCollections';
import { buildCollectionTree } from '@/app/utils/collectionTree';
import { getApiErrorMessage } from '@/app/utils/apiError';
import { QuestionType, QuestionUsageScope } from '@/app/enums';
import type {
  AdminQuestionListItem,
  AdminQuestionSearchParams,
  BulkUpdateQuestionsRequest,
} from '@/app/types';

import BulkEditQuestionsModal from './_components/BulkEditQuestionsModal';
import { useAdminQuestionList, useQuestionFilterOptions } from './_hooks/useAdminQuestions';
import styles from './QuestionsManagement.module.scss';

const cx = classNames.bind(styles);

const PAGE_SIZE = 20;

const QUESTION_TYPE_LABEL: Record<string, string> = {
  [QuestionType.MCQ]: 'Một đáp án',
  [QuestionType.MSQ]: 'Nhiều đáp án',
  [QuestionType.FILL_BLANK]: 'Điền từ',
  [QuestionType.ESSAY]: 'Tự luận',
};

const truncate = (text: string | undefined, max = 140) => {
  const value = (text || '').replace(/\s+/g, ' ').trim();
  if (!value) return '(trống)';
  return value.length > max ? `${value.slice(0, max)}…` : value;
};

function QuestionsManagement() {
  const [page, setPage] = useState(0);
  const [keyword, setKeyword] = useState('');
  const [examTypeId, setExamTypeId] = useState('');
  const [examPartId, setExamPartId] = useState('');
  const [collectionId, setCollectionId] = useState('');
  const [usageScope, setUsageScope] = useState('');
  const [questionType, setQuestionType] = useState('');

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkError, setBulkError] = useState('');
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [deletingQuestion, setDeletingQuestion] = useState<AdminQuestionListItem | null>(null);

  const { examTypes, examParts } = useQuestionFilterOptions(examTypeId);
  const { questionCollections } = useQuestionCollections();

  const params = useMemo<AdminQuestionSearchParams>(
    () => ({
      page,
      size: PAGE_SIZE,
      keyword: keyword.trim() || undefined,
      examTypeId: examTypeId || undefined,
      examPartId: examPartId || undefined,
      collectionId: collectionId || undefined,
      usageScope: (usageScope as QuestionUsageScope) || undefined,
      questionType: (questionType as QuestionType) || undefined,
    }),
    [page, keyword, examTypeId, examPartId, collectionId, usageScope, questionType],
  );

  const {
    questions,
    totalPages,
    totalElements,
    isLoading,
    isError,
    bulkUpdateMutation,
    deleteMutation,
  } = useAdminQuestionList(params);

  const resetToFirstPage = () => setPage(0);

  useEffect(() => {
    setSelectedIds(new Set());
  }, [params]);

  const pageIds = questions.map((q) => q.questionId);
  const allOnPageSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id));

  const toggleOne = (questionId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(questionId)) {
        next.delete(questionId);
      } else {
        next.add(questionId);
      }
      return next;
    });
  };

  const toggleAllOnPage = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allOnPageSelected) {
        pageIds.forEach((id) => next.delete(id));
      } else {
        pageIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const handleBulkSubmit = (
    payload: Omit<BulkUpdateQuestionsRequest, 'questionIds'>,
  ) => {
    setBulkError('');
    bulkUpdateMutation.mutate(
      { ...payload, questionIds: Array.from(selectedIds) },
      {
        onSuccess: (result) => {
          setShowBulkModal(false);
          setSelectedIds(new Set());
          const missing = result.missingQuestionIds?.length ?? 0;
          toast.success(
            missing > 0
              ? `Đã sửa ${result.updatedCount} câu, ${missing} câu không còn tồn tại.`
              : `Đã sửa ${result.updatedCount} câu.`,
          );
        },
        onError: (error) => setBulkError(getApiErrorMessage(error, 'Sửa hàng loạt thất bại.')),
      },
    );
  };

  const handleDelete = () => {
    if (!deletingQuestion) return;
    deleteMutation.mutate(deletingQuestion.questionId, {
      onSuccess: () => {
        toast.success('Đã xóa câu hỏi.');
        setDeletingQuestion(null);
      },
      onError: (error) => {
        toast.error(getApiErrorMessage(error, 'Xóa câu hỏi thất bại.'));
        setDeletingQuestion(null);
      },
    });
  };

  const columns: AdminTableColumn[] = [
    {
      key: 'select',
      width: 46,
      align: 'center',
      header: (
        <input
          type="checkbox"
          className={cx('checkbox')}
          checked={allOnPageSelected}
          onChange={toggleAllOnPage}
          aria-label="Chọn tất cả câu trong trang"
        />
      ),
      render: (row: AdminQuestionListItem) => (
        <input
          type="checkbox"
          className={cx('checkbox')}
          checked={selectedIds.has(row.questionId)}
          onChange={() => toggleOne(row.questionId)}
          aria-label={`Chọn câu ${row.questionNumber ?? ''}`}
        />
      ),
    },
    {
      key: 'questionText',
      header: 'Nội dung câu hỏi',
      render: (row: AdminQuestionListItem) => (
        <div className={cx('questionCell')}>
          <span className={cx('questionText')}>{truncate(row.questionText)}</span>
          <span className={cx('questionMeta')}>
            {row.questionNumber != null && <span>#{row.questionNumber}</span>}
            <span>{QUESTION_TYPE_LABEL[row.questionType || ''] || row.questionType}</span>
            {(row.tagNames || []).map((name) => (
              <span key={name} className={cx('tagChip')}>
                {name}
              </span>
            ))}
          </span>
        </div>
      ),
    },
    {
      key: 'examPartName',
      header: 'Loại đề / Phần thi',
      width: 200,
      render: (row: AdminQuestionListItem) => (
        <div className={cx('stackedCell')}>
          <span>{row.examTypeName || '-'}</span>
          <span className={cx('muted')}>{row.examPartName || '-'}</span>
        </div>
      ),
    },
    {
      key: 'collectionName',
      header: 'Bộ sưu tập',
      width: 170,
      render: (row: AdminQuestionListItem) =>
        row.collectionName || <span className={cx('muted')}>Chưa xếp</span>,
    },
    {
      key: 'usageScope',
      header: 'Mục đích',
      width: 130,
      align: 'center',
      render: (row: AdminQuestionListItem) => (
        <span
          className={cx('scopePill', {
            practice: row.usageScope === QuestionUsageScope.PRACTICE,
          })}
        >
          {row.usageScope === QuestionUsageScope.PRACTICE ? 'Ôn tập' : 'Thi'}
        </span>
      ),
    },
  ];

  const practiceOnPage = questions.filter(
    (q) => q.usageScope === QuestionUsageScope.PRACTICE,
  ).length;

  return (
    <div className={cx('wrapper')}>
      <AdminPageHeader
        title="Quản lý câu hỏi"
        description="Duyệt toàn bộ ngân hàng câu hỏi, sửa từng câu hoặc sửa hàng loạt thuộc tính chung."
      />

      <StatCardGroup>
        <StatCard label="Câu khớp bộ lọc" value={totalElements} />
        <StatCard
          label="Câu ôn tập trong trang"
          value={`${practiceOnPage}/${questions.length}`}
        />
        <StatCard label="Đang chọn" value={selectedIds.size} />
      </StatCardGroup>

      <AdminToolbar
        searchValue={keyword}
        onSearchChange={(value) => {
          setKeyword(value);
          resetToFirstPage();
        }}
        searchPlaceholder="Tìm trong nội dung câu hỏi..."
      >
        <ButtonPrime
          variant="primary"
          disabled={selectedIds.size === 0}
          onClick={() => {
            setBulkError('');
            setShowBulkModal(true);
          }}
        >
          Sửa hàng loạt ({selectedIds.size})
        </ButtonPrime>
      </AdminToolbar>

      <div className={cx('filterRow')}>
        <select
          className={cx('filterInput')}
          value={examTypeId}
          onChange={(e) => {
            setExamTypeId(e.target.value);
            setExamPartId('');
            resetToFirstPage();
          }}
        >
          <option value="">Tất cả loại đề</option>
          {examTypes.map((type) => (
            <option key={type.examTypeId} value={type.examTypeId}>
              {type.name}
            </option>
          ))}
        </select>

        <select
          className={cx('filterInput')}
          value={examPartId}
          disabled={!examTypeId}
          onChange={(e) => {
            setExamPartId(e.target.value);
            resetToFirstPage();
          }}
        >
          <option value="">{examTypeId ? 'Tất cả phần thi' : 'Chọn loại đề trước'}</option>
          {examParts.map((part) => (
            <option key={part.examPartId} value={part.examPartId}>
              {part.name}
            </option>
          ))}
        </select>

        <select
          className={cx('filterInput')}
          value={collectionId}
          onChange={(e) => {
            setCollectionId(e.target.value);
            resetToFirstPage();
          }}
        >
          <option value="">Tất cả bộ sưu tập</option>
          <option value={UNCLASSIFIED_COLLECTION}>Chưa xếp bộ sưu tập</option>
          {buildCollectionTree(questionCollections).map((c) => (
            <option key={c.collectionId} value={c.collectionId}>
              {c.depth > 0 ? `    └ ${c.name}` : c.name}
            </option>
          ))}
        </select>

        <select
          className={cx('filterInput')}
          value={usageScope}
          onChange={(e) => {
            setUsageScope(e.target.value);
            resetToFirstPage();
          }}
        >
          <option value="">Thi và ôn tập</option>
          <option value={QuestionUsageScope.EXAM}>Chỉ câu thi</option>
          <option value={QuestionUsageScope.PRACTICE}>Chỉ câu ôn tập</option>
        </select>

        <select
          className={cx('filterInput')}
          value={questionType}
          onChange={(e) => {
            setQuestionType(e.target.value);
            resetToFirstPage();
          }}
        >
          <option value="">Mọi dạng câu</option>
          {Object.entries(QUESTION_TYPE_LABEL).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {isError && (
        <div className={cx('errorBox')}>
          Không tải được danh sách câu hỏi. Thử lại hoặc kiểm tra quyền QUESTION:MANAGE.
        </div>
      )}

      <AdminTable
        columns={columns}
        data={questions}
        loading={isLoading}
        getRowKey={(row: AdminQuestionListItem) => row.questionId}
        emptyText="Không có câu hỏi nào khớp bộ lọc."
        itemLabel="câu hỏi"
        page={page}
        pageSize={PAGE_SIZE}
        totalPages={totalPages}
        totalElements={totalElements}
        onPageChange={setPage}
        rowActions={(row: AdminQuestionListItem) => (
          <>
            <button
              type="button"
              className={cx('rowBtn')}
              title="Sửa câu này"
              onClick={() => setEditingQuestionId(row.questionId)}
            >
              <Edit size={16} />
            </button>
            <button
              type="button"
              className={cx('rowBtn', 'danger')}
              title="Xóa câu này"
              onClick={() => setDeletingQuestion(row)}
            >
              <Trash2 size={16} />
            </button>
          </>
        )}
      />

      <BulkEditQuestionsModal
        show={showBulkModal}
        onClose={() => setShowBulkModal(false)}
        selectedCount={selectedIds.size}
        collections={questionCollections}
        saving={bulkUpdateMutation.isPending}
        errorMessage={bulkError}
        onSubmit={handleBulkSubmit}
      />

      <EditQuestionModal
        show={!!editingQuestionId}
        questionId={editingQuestionId}
        onHide={() => setEditingQuestionId(null)}
        onSuccess={() => setEditingQuestionId(null)}
      />

      <ConfirmDeleteModal
        show={!!deletingQuestion}
        onClose={() => setDeletingQuestion(null)}
        onConfirm={handleDelete}
        title="Xóa câu hỏi"
        message={
          <>
            Xóa câu &ldquo;{truncate(deletingQuestion?.questionText, 80)}&rdquo;? Câu này sẽ bị
            gỡ khỏi mọi đề đang chứa nó; kết quả các bài đã làm vẫn được giữ lại.
          </>
        }
      />
    </div>
  );
}

export default QuestionsManagement;
