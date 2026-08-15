'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Spinner } from 'react-bootstrap';
import { IoDocumentTextOutline } from 'react-icons/io5';
import routes, { buildExamTypeDetailPath } from '@/app/configs/Routes';

import TestListContainer from '@/app/components/tests/TestListContainer/TestListContainer';
import Pagination from '@/app/components/Pagination/Pagination';
import { useCollectionTests, useCollectionName } from './_hooks/useCollectionTests';

const PAGE_SIZE = 12;

function TestByCollection() {
  const { examTypeId, collectionId } = useParams<{
    examTypeId: string;
    collectionId: string;
  }>();
  const router = useRouter();

  const [countdowns, setCountdowns] = useState<Record<string, number>>({});
  const [currentPage, setCurrentPage] = useState(0);

  const testsQuery = useCollectionTests(collectionId, currentPage, PAGE_SIZE);
  const { tests, totalPages, isLoading: loading } = testsQuery;
  const { collectionName: folderName = '' } = useCollectionName(examTypeId, collectionId);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const updated: Record<string, number> = {};
      tests.forEach((t) => {
        if (t.availableFrom) {
          const diff = new Date(t.availableFrom).getTime() - now.getTime();
          if (diff > 0) updated[t.testId] = diff;
        }
      });
      setCountdowns(updated);
    }, 1000);
    return () => clearInterval(interval);
  }, [tests]);

  if (loading && tests.length === 0 && currentPage === 0 && totalPages === 0) {
    return (
      <div
        className="d-flex flex-column align-items-center justify-content-center"
        style={{ minHeight: '60vh' }}
      >
        <Spinner animation="grow" variant="info" />
        <p className="mt-3 fw-bold text-info">Đang tải bộ đề...</p>
      </div>
    );
  }

  const emptyState = (
    <div style={{ textAlign: 'center', padding: '40px 0' }}>
      <IoDocumentTextOutline style={{ fontSize: '4rem', color: '#94a3b8' }} />
      <h4 style={{ marginTop: 12 }}>Bộ đề này chưa có đề nào</h4>
      <p className="text-muted">Vui lòng quay lại sau.</p>
    </div>
  );

  const goBack = () =>
    router.push(examTypeId ? buildExamTypeDetailPath(examTypeId) : routes.home);

  return (
    <TestListContainer
      title={folderName || 'Bộ đề'}
      label="Khám phá bộ đề"
      secondaryActionText="Quay lại"
      onSecondaryAction={goBack}
      tests={tests}
      countdowns={countdowns}
      emptyState={emptyState}
      footer={
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onChange={setCurrentPage}
        />
      }
    />
  );
}

export default TestByCollection;
