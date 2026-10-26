'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import classNames from 'classnames/bind';
import { FileText, CirclePlus } from 'lucide-react';
import { toast } from 'react-toastify';

import styles from './TestByClass.module.scss';
import { useTestByClass } from './_hooks/useTestByClass';
import CreateTestModal from '@/app/features/tests/CreateTestModal';
import ConfirmDeleteModal from '@/app/components/modal/ConfirmDeleteModal';
import TestListContainer from '@/app/features/tests/TestListContainer/TestListContainer';
import type { TestResponse } from '@/app/types';
import Loading from '@/app/components/Loading/Loading';

const cx = classNames.bind(styles);

function TestByClass() {
  const t = useTranslations('Classes');
  const { classId, chapterId } = useParams<{ classId: string; chapterId: string }>();
  const { className, tests, isLoading, refetchTests, deleteTestMutation } =
    useTestByClass(classId, chapterId);
  const [countdowns, setCountdowns] = useState<Record<string, number>>({});
  const [showCreateTestModal, setShowCreateTestModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [testToDelete, setTestToDelete] = useState<TestResponse | null>(null);

  const handleDeleteTest = (testId: string) => {
    const selectedTest = tests.find((testItem) => testItem.testId === testId);
    setTestToDelete(selectedTest || null);
    setShowDeleteModal(true);
  };

  const handleConfirmDeleteTest = async () => {
    if (!testToDelete?.testId) {
      return;
    }

    try {
      await deleteTestMutation.mutateAsync(testToDelete.testId);
      toast.success(t('classTests.deleteSuccess'));
    } catch (err) {
      console.error(' Lỗi xóa bài test:', err);
      toast.error(t('classTests.deleteFailed'));
    } finally {
      setShowDeleteModal(false);
      setTestToDelete(null);
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const updatedCountdowns: Record<string, number> = {};
      tests.forEach((test) => {
        if (test.availableFrom) {
          const diff = new Date(test.availableFrom).getTime() - now.getTime();
          if (diff > 0) updatedCountdowns[test.testId] = diff;
        }
      });
      setCountdowns(updatedCountdowns);
    }, 1000);
    return () => clearInterval(interval);
  }, [tests]);

  if (isLoading) {
    return (
      <Loading label={t('classTests.loading')} />
    );
  }

  const emptyState = (
    <div className={cx('empty-state')}>
      <FileText className={cx('icon')} />
      <h4>{t('classTests.emptyTitle')}</h4>
      <p>{t('classTests.emptyDescription')}</p>
    </div>
  );

  return (
    <>
      <TestListContainer
        title={className || t('classTests.classFallback')}
        label={t('classTests.label')}
        actionText={t('classTests.create')}
        actionIcon={CirclePlus}
        onAction={() => setShowCreateTestModal(true)}
        tests={tests}
        countdowns={countdowns}
        handleDeleteTest={handleDeleteTest}
        onRefresh={refetchTests}
        emptyState={emptyState}
      />

      <CreateTestModal
        show={showCreateTestModal}
        onClose={() => setShowCreateTestModal(false)}
        mode="class"
        classId={classId}
        chapterId={chapterId}
        onSuccess={() => {
          refetchTests();
          setShowCreateTestModal(false);
          toast.success(t('classTests.createSuccess'));
        }}
      />

      <ConfirmDeleteModal
        show={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setTestToDelete(null);
        }}
        onConfirm={handleConfirmDeleteTest}
        title={t('classTests.deleteTitle')}
        message={testToDelete?.title
          ? t('classTests.deleteMessage', { title: testToDelete.title })
          : t('classTests.deleteMessageUntitled')}
      />
    </>
  );
}

export default TestByClass;
