'use client';

import { useMemo, useState } from 'react';
import {Badge, Form} from 'react-bootstrap';
import ButtonPrime from '@/app/components/Button/ButtonPrime';
import {useTranslations} from 'next-intl';
import {Eye, Trash2} from 'lucide-react';

import ConfirmDeleteModal from '@/app/components/modal/ConfirmDeleteModal';
import useDebouncedValue from '@/app/hooks/useDebouncedValue';
import {
  AdminFieldError,
  AdminPageHeader,
  AdminTable,
  AdminTabs,
  AdminToolbar,
  StatCard,
  StatCardGroup,
} from '@/app/[locale]/(admin)/_components/common';
import type {AdminTableColumn} from '@/app/[locale]/(admin)/_components/common/AdminTable';
import {EVALUATION_GENERAL_FILTER} from '@/app/apis/evaluationApi';
import type {EvaluationTestStats} from '@/app/types';
import { formatDateTime } from '@/app/utils/format-date-time';
import {
  useAdminEvaluations,
  useEvaluationMutations,
  useEvaluationStats,
  type AdminEvaluation,
} from './_hooks/useAdminEvaluations';

type Tab = 'byTest' | 'list';

// Điểm trung bình dưới ngưỡng này được tô đỏ để admin ưu tiên xem lại đề.
const LOW_AVERAGE_THRESHOLD = 3.5;

const ratingVariant = (rating: number) => (rating >= 4 ? 'success' : rating >= 3 ? 'warning' : 'danger');

function EvaluationsManagement() {
  const t = useTranslations('AdminContent.evaluations');
  const ITEMS_PER_PAGE = 10;
  const [tab, setTab] = useState<Tab>('byTest');
  const [currentPage, setCurrentPage] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [ratingFilter, setRatingFilter] = useState('all');
  const [testFilter, setTestFilter] = useState('all');
  const [errorMessage, setErrorMessage] = useState('');
  const [deletingEvaluation, setDeletingEvaluation] = useState<AdminEvaluation | null>(null);

  const debouncedKeyword = useDebouncedValue(keyword, 300);

  const {stats, isLoading: statsLoading, isError: statsError} = useEvaluationStats();

  const {
    evaluationList,
    totalElements,
    totalPages,
    isLoading: loading,
    isError,
  } = useAdminEvaluations({
    page: currentPage,
    size: ITEMS_PER_PAGE,
    keyword: debouncedKeyword,
    rating: ratingFilter,
    testId: testFilter,
  });

  const {deleteMutation} = useEvaluationMutations();

  const summary = useMemo(() => {
    const total = stats.reduce((sum, s) => sum + s.count, 0);
    const weighted = stats.reduce((sum, s) => sum + s.averageRating * s.count, 0);
    return {
      total,
      average: total ? (weighted / total).toFixed(2) : '-',
      lowTests: stats.filter((s) => s.averageRating < LOW_AVERAGE_THRESHOLD).length,
    };
  }, [stats]);

  const showTestEvaluations = (testId: string) => {
    setTestFilter(testId);
    setRatingFilter('all');
    setKeyword('');
    setCurrentPage(1);
    setTab('list');
  };

  const handleDelete = async () => {
    if (!deletingEvaluation) {
      return;
    }

    setErrorMessage('');
    try {
      await deleteMutation.mutateAsync(deletingEvaluation.id);
      setDeletingEvaluation(null);
    } catch {
      setErrorMessage(t('errors.deleteFailed'));
    }
  };

  const statsColumns: AdminTableColumn[] = [
    {key: 'testTitle', header: t('columns.test'), render: (s: EvaluationTestStats) => s.testTitle},
    {
      key: 'averageRating',
      header: t('columns.average'),
      render: (s: EvaluationTestStats) => (
        <Badge bg={s.averageRating < LOW_AVERAGE_THRESHOLD ? 'danger' : 'success'}>
          {s.averageRating.toFixed(2)}/5
        </Badge>
      ),
    },
    {key: 'count', header: t('columns.count'), render: (s: EvaluationTestStats) => s.count},
    {key: 'lowRatingCount', header: t('columns.lowRatingCount'), render: (s: EvaluationTestStats) => s.lowRatingCount},
  ];

  const listColumns: AdminTableColumn[] = [
    {
      key: 'username',
      header: t('columns.user'),
      render: (evaluation: AdminEvaluation) => <div>{evaluation.username || t('anonymous')}</div>,
    },
    {
      key: 'test',
      header: t('columns.test'),
      render: (evaluation: AdminEvaluation) =>
        evaluation.test_title ?? <span className="text-muted">{t('general')}</span>,
    },
    {
      key: 'rating',
      header: 'Rating',
      render: (evaluation: AdminEvaluation) => (
        <Badge bg={ratingVariant(evaluation.rating)}>{evaluation.rating}/5</Badge>
      ),
    },
    {
      key: 'content',
      header: t('columns.content'),
      render: (evaluation: AdminEvaluation) =>
        evaluation.content || <span className="text-muted">—</span>,
    },
    {
      key: 'created_at',
      header: t('columns.createdAt'),
      render: (evaluation: AdminEvaluation) =>
        formatDateTime(evaluation.created_at),
    },
  ];

  return (
    <div className="d-flex flex-column gap-3">
      <AdminPageHeader
        title={t('title')}
        description={t('description')}
      />

      <StatCardGroup>
        <StatCard label={t('stats.total')} value={summary.total} />
        <StatCard label={t('stats.average')} value={summary.average} />
        <StatCard label={t('stats.lowTests', {threshold: LOW_AVERAGE_THRESHOLD})} value={summary.lowTests} />
      </StatCardGroup>

      <AdminTabs
        activeKey={tab}
        onSelect={(key) => setTab((key as Tab) || 'byTest')}
        items={[
          {key: 'byTest', label: t('tabs.byTest')},
          {key: 'list', label: t('tabs.list')},
        ]}
      />

      {tab === 'byTest' ? (
        <>
          <AdminFieldError message={statsError ? t('errors.statsLoadFailed') : ''} />
          <AdminTable
            showIndex
            paginated
            itemLabel={t('testItemLabel')}
            columns={statsColumns}
            data={stats}
            loading={statsLoading}
            emptyText={t('statsEmpty')}
            getRowKey={(s: EvaluationTestStats) => s.testId}
            rowActions={(s: EvaluationTestStats) => (
              <button onClick={() => showTestEvaluations(s.testId)} title={t('viewTestEvaluations')}>
                <Eye size={14} />
              </button>
            )}
          />
        </>
      ) : (
        <>
          <AdminToolbar
            searchValue={keyword}
            onSearchChange={(value: string) => {
              setKeyword(value);
              setCurrentPage(1);
            }}
            searchPlaceholder={t('searchPlaceholder')}
          >
            <Form.Select
              value={testFilter}
              onChange={(event) => {
                setTestFilter(event.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="all">{t('filters.allTests')}</option>
              {stats.map((s) => (
                <option key={s.testId} value={s.testId}>{s.testTitle}</option>
              ))}
              <option value={EVALUATION_GENERAL_FILTER}>{t('filters.general')}</option>
            </Form.Select>
            <Form.Select
              value={ratingFilter}
              onChange={(event) => {
                setRatingFilter(event.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="all">{t('filters.allRatings')}</option>
              <option value="5">{t('filters.stars', {count: 5})}</option>
              <option value="4">{t('filters.stars', {count: 4})}</option>
              <option value="3">{t('filters.stars', {count: 3})}</option>
              <option value="2">{t('filters.stars', {count: 2})}</option>
              <option value="1">{t('filters.stars', {count: 1})}</option>
            </Form.Select>
            {testFilter !== 'all' && (
              <ButtonPrime variant="outline" onClick={() => setTestFilter('all')}>
                {t('filters.clearTest')}
              </ButtonPrime>
            )}
          </AdminToolbar>
          <AdminFieldError
            message={errorMessage || (isError ? t('errors.loadFailed') : '')}
          />

          <AdminTable
            showIndex
            itemLabel={t('itemLabel')}
            columns={listColumns}
            data={evaluationList}
            loading={loading}
            getRowKey={(evaluation: AdminEvaluation) => evaluation.id}
            page={currentPage - 1}
            totalPages={totalPages}
            totalElements={totalElements}
            pageSize={ITEMS_PER_PAGE}
            onPageChange={(p: number) => setCurrentPage(p + 1)}
            rowActions={(evaluation: AdminEvaluation) => (
              <button
                className="danger"
                onClick={() => setDeletingEvaluation(evaluation)}
                title={t('delete')}
              >
                <Trash2 size={14} />
              </button>
            )}
          />
        </>
      )}

      <ConfirmDeleteModal
        show={Boolean(deletingEvaluation)}
        onClose={() => {
          if (deleteMutation.isPending) {
            return;
          }
          setDeletingEvaluation(null);
        }}
        onConfirm={handleDelete}
        title={t('deleteTitle')}
        message={t('deleteMessage')}
      />
    </div>
  );
}

export default EvaluationsManagement;
