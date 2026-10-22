'use client';

import { useMemo, useState } from 'react';
import {Badge, Button, Form} from 'react-bootstrap';
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
} from '@/app/(admin)/_components/common';
import type {AdminTableColumn} from '@/app/(admin)/_components/common/AdminTable';
import {EVALUATION_GENERAL_FILTER} from '@/app/apis/evaluationApi';
import type {EvaluationTestStats} from '@/app/types';
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
      setErrorMessage('Không thể xóa đánh giá.');
    }
  };

  const statsColumns: AdminTableColumn[] = [
    {key: 'testTitle', header: 'Đề', render: (s: EvaluationTestStats) => s.testTitle},
    {
      key: 'averageRating',
      header: 'Trung bình',
      render: (s: EvaluationTestStats) => (
        <Badge bg={s.averageRating < LOW_AVERAGE_THRESHOLD ? 'danger' : 'success'}>
          {s.averageRating.toFixed(2)}/5
        </Badge>
      ),
    },
    {key: 'count', header: 'Lượt đánh giá', render: (s: EvaluationTestStats) => s.count},
    {key: 'lowRatingCount', header: 'Số lượt 1–2 sao', render: (s: EvaluationTestStats) => s.lowRatingCount},
  ];

  const listColumns: AdminTableColumn[] = [
    {
      key: 'username',
      header: 'Người dùng',
      render: (evaluation: AdminEvaluation) => <div>{evaluation.username}</div>,
    },
    {
      key: 'test',
      header: 'Đề',
      render: (evaluation: AdminEvaluation) =>
        evaluation.test_title ?? <span className="text-muted">Chung</span>,
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
      header: 'Góp ý',
      render: (evaluation: AdminEvaluation) =>
        evaluation.content || <span className="text-muted">—</span>,
    },
    {
      key: 'created_at',
      header: 'Ngày tạo',
      render: (evaluation: AdminEvaluation) =>
        evaluation.created_at
          ? new Date(evaluation.created_at).toLocaleString('vi-VN')
          : '-',
    },
  ];

  return (
    <div className="d-flex flex-column gap-3">
      <AdminPageHeader
        title="Đánh giá đề"
        description="Học viên đánh giá đề sau khi làm full. Chỉ quản trị viên xem được, dùng để cải thiện chất lượng đề."
      />

      <StatCardGroup>
        <StatCard label="Lượt đánh giá đề" value={summary.total} />
        <StatCard label="Điểm trung bình" value={summary.average} />
        <StatCard label={`Đề dưới ${LOW_AVERAGE_THRESHOLD} sao`} value={summary.lowTests} />
      </StatCardGroup>

      <AdminTabs
        activeKey={tab}
        onSelect={(key) => setTab((key as Tab) || 'byTest')}
        items={[
          {key: 'byTest', label: 'Theo đề'},
          {key: 'list', label: 'Tất cả đánh giá'},
        ]}
      />

      {tab === 'byTest' ? (
        <>
          <AdminFieldError message={statsError ? 'Không thể tải thống kê đánh giá.' : ''} />
          <AdminTable
            showIndex
            paginated
            itemLabel="đề"
            columns={statsColumns}
            data={stats}
            loading={statsLoading}
            emptyText="Chưa có đánh giá đề nào."
            getRowKey={(s: EvaluationTestStats) => s.testId}
            rowActions={(s: EvaluationTestStats) => (
              <button onClick={() => showTestEvaluations(s.testId)} title="Xem đánh giá của đề">
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
            searchPlaceholder="Tìm theo nội dung góp ý..."
          >
            <Form.Select
              value={testFilter}
              onChange={(event) => {
                setTestFilter(event.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="all">Tất cả đề</option>
              {stats.map((s) => (
                <option key={s.testId} value={s.testId}>{s.testTitle}</option>
              ))}
              <option value={EVALUATION_GENERAL_FILTER}>Đánh giá chung (cũ)</option>
            </Form.Select>
            <Form.Select
              value={ratingFilter}
              onChange={(event) => {
                setRatingFilter(event.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="all">Tất cả rating</option>
              <option value="5">5 sao</option>
              <option value="4">4 sao</option>
              <option value="3">3 sao</option>
              <option value="2">2 sao</option>
              <option value="1">1 sao</option>
            </Form.Select>
            {testFilter !== 'all' && (
              <Button variant="outline-secondary" onClick={() => setTestFilter('all')}>
                Bỏ lọc đề
              </Button>
            )}
          </AdminToolbar>
          <AdminFieldError
            message={errorMessage || (isError ? 'Không thể tải danh sách đánh giá.' : '')}
          />

          <AdminTable
            showIndex
            itemLabel="đánh giá"
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
                title="Xóa đánh giá"
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
        title="Xác nhận xóa đánh giá"
        message="Bạn có chắc muốn xóa đánh giá này không?"
      />
    </div>
  );
}

export default EvaluationsManagement;
