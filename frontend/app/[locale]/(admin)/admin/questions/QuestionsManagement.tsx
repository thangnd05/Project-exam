'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import classNames from 'classnames/bind';
import { toast } from 'react-toastify';
import { Edit, Trash2 } from 'lucide-react';

import {
  AdminExamTypePicker,
  AdminPageHeader,
  AdminTable,
  AdminToolbar,
  StatCard,
  StatCardGroup,
} from '@/app/[locale]/(admin)/_components/common';
import type { AdminTableColumn } from '@/app/[locale]/(admin)/_components/common/AdminTable';
import ButtonPrime from '@/app/components/Button/ButtonPrime';
import ConfirmDeleteModal from '@/app/components/modal/ConfirmDeleteModal';
import EditQuestionModal from '@/app/features/tests/EditQuestionModal';
import { UNCLASSIFIED_COLLECTION } from '@/app/apis/questionApi';
import { useQuestionCollections } from '@/app/features/tests/hooks/useQuestionCollections';
import { buildCollectionTree } from '@/app/features/tests/collectionTree';
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

const QUESTION_TYPES = [
  QuestionType.MCQ,
  QuestionType.MSQ,
  QuestionType.FILL_BLANK,
  QuestionType.ESSAY,
] as const;

const isKnownQuestionType = (value: string): value is (typeof QUESTION_TYPES)[number] =>
  (QUESTION_TYPES as readonly string[]).includes(value);

const truncate = (text: string | undefined, emptyLabel: string, max = 140) => {
  const value = (text || '').replace(/\s+/g, ' ').trim();
  if (!value) return emptyLabel;
  return value.length > max ? `${value.slice(0, max)}…` : value;
};

function QuestionsManagement() {
  const t = useTranslations('AdminContent.questions');
  const [page, setPage] = useState(0);
  const [keyword, setKeyword] = useState('');
  const [examTypeId, setExamTypeId] = useState('');
  const [examPartId, setExamPartId] = useState('');
  const [collectionId, setCollectionId] = useState('');
  const [tagId, setTagId] = useState('');
  const [usageScope, setUsageScope] = useState('');
  const [questionType, setQuestionType] = useState('');

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkError, setBulkError] = useState('');
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [deletingQuestion, setDeletingQuestion] = useState<AdminQuestionListItem | null>(null);

  const { examParts, tags } = useQuestionFilterOptions(examTypeId);
  const visibleTags = tags.filter(
    (tag) => !examPartId || !tag.examPartId || tag.examPartId === examPartId,
  );
  const { questionCollections } = useQuestionCollections();

  const params = useMemo<AdminQuestionSearchParams>(
    () => ({
      page,
      size: PAGE_SIZE,
      keyword: keyword.trim() || undefined,
      examTypeId: examTypeId || undefined,
      examPartId: examPartId || undefined,
      collectionId: collectionId || undefined,
      tagId: tagId || undefined,
      usageScope: (usageScope as QuestionUsageScope) || undefined,
      questionType: (questionType as QuestionType) || undefined,
    }),
    [page, keyword, examTypeId, examPartId, collectionId, tagId, usageScope, questionType],
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

  // Đổi bộ lọc/trang thì bỏ chọn
  const [prevParams, setPrevParams] = useState(params);
  if (params !== prevParams) {
    setPrevParams(params);
    setSelectedIds(new Set());
  }

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
              ? t('bulkSuccessWithMissing', { count: result.updatedCount, missing })
              : t('bulkSuccess', { count: result.updatedCount }),
          );
        },
        onError: (error) => setBulkError(getApiErrorMessage(error, t('bulkFailed'))),
      },
    );
  };

  const handleDelete = () => {
    if (!deletingQuestion) return;
    deleteMutation.mutate(deletingQuestion.questionId, {
      onSuccess: () => {
        toast.success(t('deleteSuccess'));
        setDeletingQuestion(null);
      },
      onError: (error) => {
        toast.error(getApiErrorMessage(error, t('deleteFailed')));
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
          aria-label={t('selectAllOnPage')}
        />
      ),
      render: (row: AdminQuestionListItem) => (
        <input
          type="checkbox"
          className={cx('checkbox')}
          checked={selectedIds.has(row.questionId)}
          onChange={() => toggleOne(row.questionId)}
          aria-label={t('selectQuestion', { number: row.questionNumber ?? '' })}
        />
      ),
    },
    {
      key: 'questionText',
      header: t('columns.questionText'),
      render: (row: AdminQuestionListItem) => (
        <div className={cx('questionCell')}>
          <span className={cx('questionText')}>{truncate(row.questionText, t('emptyText'))}</span>
          <span className={cx('questionMeta')}>
            {row.questionNumber != null && <span>#{row.questionNumber}</span>}
            <span>
              {row.questionType && isKnownQuestionType(row.questionType)
                ? t(`questionTypes.${row.questionType}`)
                : row.questionType}
            </span>
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
      header: t('columns.examPart'),
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
      header: t('columns.collection'),
      width: 170,
      render: (row: AdminQuestionListItem) =>
        row.collectionName || <span className={cx('muted')}>{t('unclassified')}</span>,
    },
    {
      key: 'usageScope',
      header: t('columns.usageScope'),
      width: 130,
      align: 'center',
      render: (row: AdminQuestionListItem) => (
        <span
          className={cx('scopePill', {
            practice: row.usageScope === QuestionUsageScope.PRACTICE,
          })}
        >
          {row.usageScope === QuestionUsageScope.PRACTICE ? t('scope.practice') : t('scope.exam')}
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
        title={t('title')}
        description={t('description')}
      />

      <StatCardGroup>
        <StatCard label={t('stats.matching')} value={totalElements} />
        <StatCard
          label={t('stats.practiceOnPage')}
          value={`${practiceOnPage}/${questions.length}`}
        />
        <StatCard label={t('stats.selected')} value={selectedIds.size} />
      </StatCardGroup>

      <AdminToolbar
        searchValue={keyword}
        onSearchChange={(value) => {
          setKeyword(value);
          resetToFirstPage();
        }}
        searchPlaceholder={t('searchPlaceholder')}
        filters={
          <AdminExamTypePicker
            value={examTypeId}
            onChange={(nextExamTypeId) => {
              setExamTypeId(nextExamTypeId);
              setExamPartId('');
              setTagId('');
              resetToFirstPage();
            }}
            clearable
          />
        }
      >
        <ButtonPrime
          variant="primary"
          disabled={selectedIds.size === 0}
          onClick={() => {
            setBulkError('');
            setShowBulkModal(true);
          }}
        >
          {t('bulkEdit', { count: selectedIds.size })}
        </ButtonPrime>
      </AdminToolbar>

      <div className={cx('filterRow')}>
        <select
          className={cx('filterInput')}
          value={examPartId}
          disabled={!examTypeId}
          onChange={(e) => {
            const nextPartId = e.target.value;
            setExamPartId(nextPartId);
            const selectedTag = tags.find((tag) => tag.tagId === tagId);
            if (nextPartId && selectedTag?.examPartId && selectedTag.examPartId !== nextPartId) {
              setTagId('');
            }
            resetToFirstPage();
          }}
        >
          <option value="">{examTypeId ? t('filters.allExamParts') : t('filters.selectExamTypeFirst')}</option>
          {examParts.map((part) => (
            <option key={part.examPartId} value={part.examPartId}>
              {part.name}
            </option>
          ))}
        </select>

        <select
          className={cx('filterInput')}
          value={tagId}
          disabled={!examTypeId}
          onChange={(e) => {
            setTagId(e.target.value);
            resetToFirstPage();
          }}
        >
          <option value="">{examTypeId ? t('filters.allTags') : t('filters.selectExamTypeForTags')}</option>
          {visibleTags.map((tag) => (
            <option key={tag.tagId} value={tag.tagId}>
              {!examPartId && tag.examPartName ? `${tag.name} (${tag.examPartName})` : tag.name}
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
          <option value="">{t('filters.allCollections')}</option>
          <option value={UNCLASSIFIED_COLLECTION}>{t('filters.unclassifiedCollection')}</option>
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
          <option value="">{t('filters.allScopes')}</option>
          <option value={QuestionUsageScope.EXAM}>{t('filters.examOnly')}</option>
          <option value={QuestionUsageScope.PRACTICE}>{t('filters.practiceOnly')}</option>
        </select>

        <select
          className={cx('filterInput')}
          value={questionType}
          onChange={(e) => {
            setQuestionType(e.target.value);
            resetToFirstPage();
          }}
        >
          <option value="">{t('filters.allQuestionTypes')}</option>
          {QUESTION_TYPES.map((value) => (
            <option key={value} value={value}>
              {t(`questionTypes.${value}`)}
            </option>
          ))}
        </select>
      </div>

      {isError && (
        <div className={cx('errorBox')}>
          {t('loadFailed')}
        </div>
      )}

      <AdminTable
        columns={columns}
        data={questions}
        loading={isLoading}
        getRowKey={(row: AdminQuestionListItem) => row.questionId}
        emptyText={t('empty')}
        itemLabel={t('itemLabel')}
        page={page}
        pageSize={PAGE_SIZE}
        totalPages={totalPages}
        totalElements={totalElements}
        onPageChange={setPage}
        rowActions={(row: AdminQuestionListItem) => (
          <>
            <ButtonPrime size="icon" variant="ghost"
              title={t('editQuestion')}
              onClick={() => setEditingQuestionId(row.questionId)}
            >
              <Edit size={16} />
            </ButtonPrime>
            <ButtonPrime size="icon" variant="dangerGhost"
              title={t('deleteQuestion')}
              onClick={() => setDeletingQuestion(row)}
            >
              <Trash2 size={16} />
            </ButtonPrime>
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
        title={t('deleteTitle')}
        message={t('deleteMessage', {
          text: truncate(deletingQuestion?.questionText, t('emptyText'), 80),
        })}
      />
    </div>
  );
}

export default QuestionsManagement;
