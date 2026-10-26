'use client';

import { useParams } from 'next/navigation';
import { useLocalizeHref, useRouter } from '@/app/i18n/navigation';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { FileText } from 'lucide-react';
import routes from '@/app/configs/Routes';

import TestListContainer from '@/app/features/tests/TestListContainer/TestListContainer';
import Pagination from '@/app/components/Pagination/Pagination';
import EmptyState from '@/app/components/EmptyState/EmptyState';
import { useCollectionTests, useCollectionName } from '@/app/[locale]/(public)/exam-types/[group]/_hooks/useCollectionTests';
import Loading from '@/app/components/Loading/Loading';

const PAGE_SIZE = 12;

type TestByCollectionProps = {
  // Server tra từ slug trên URL rồi truyền xuống, kèm đường dẫn quay lại trang kỳ thi.
  examTypeId: string;
  examHref: string;
};

function TestByCollection({ examTypeId, examHref }: TestByCollectionProps) {
  const { collectionId } = useParams<{ collectionId: string }>();
  const router = useRouter();
  const localizeHref = useLocalizeHref();
  const t = useTranslations('ExamTypes.collection');

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
      <Loading label={t('loading')} />
    );
  }

  const emptyState = (
    <EmptyState icon={FileText} title={t('empty.title')} description={t('empty.hint')} />
  );

  const goBack = () => router.push(localizeHref(examHref || routes.home));

  return (
    <TestListContainer
      title={folderName || t('fallbackTitle')}
      label={t('label')}
      secondaryActionText={t('back')}
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
