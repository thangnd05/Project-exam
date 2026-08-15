'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Spinner } from 'react-bootstrap';
import { toast } from 'react-toastify';
import classNames from 'classnames/bind';
import {
  IoAdd,
  IoDocumentTextOutline,
} from 'react-icons/io5';

import styles from './MyTestPage.module.scss';
import { useAuth } from '@/app/hooks/useAuth';
import { useMyTests, useDeleteTest, useInvalidateMyTests } from '@/app/hooks/useMyTests';
import CreateTestModal from '@/app/features/tests/components/CreateTestModal';
import ConfirmDeleteModal from '@/app/components/modal/ConfirmDeleteModal';
import TestListContainer from '@/app/features/tests/components/TestListContainer/TestListContainer';
import Pagination from '@/app/components/Pagination/Pagination';

const cx = classNames.bind(styles);
const PAGE_SIZE = 12;

function MyTestPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [countdowns, setCountdowns] = useState({});
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [testToDelete, setTestToDelete] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);

  const { tests, totalPages, isLoading: loading, isError } = useMyTests({
    page: currentPage,
    size: PAGE_SIZE,
  });
  const deleteTestMutation = useDeleteTest();
  const invalidateMyTests = useInvalidateMyTests();

  const handleDeleteTest = (testId) => {
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
      toast.success('Xóa bài kiểm tra thành công!');

      if (tests.length === 1 && currentPage > 0) {
        setCurrentPage((prev) => prev - 1);
      }
    } catch (err) {
      console.error(' Lỗi xóa bài test:', err);
      toast.error('Không thể xóa bài kiểm tra. Vui lòng thử lại.');
    } finally {
      setShowDeleteModal(false);
      setTestToDelete(null);
    }
  };

  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  useEffect(() => {
    if (isError) {
      toast.error('Không thể tải danh sách bài kiểm tra.');
    }
  }, [isError]);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const updated = {};

      tests.forEach((t) => {
        if (t.availableFrom) {
          const diff = new Date(t.availableFrom) - now;
          if (diff > 0) updated[t.testId] = diff;
        }
      });

      setCountdowns(updated);
    }, 1000);

    return () => clearInterval(interval);
  }, [tests]);

  if (loading) {
    return (
      <div className={cx('loading-box')}>
        <Spinner animation="grow" variant="primary" size="lg" />
        <p>Đang tải bộ sưu tập đề thi...</p>
      </div>
    );
  }

  const emptyState = (
    <div className={cx('empty-state')}>
      <IoDocumentTextOutline className={cx('icon')} />
      <h4>Kho lưu trữ hiện đang trống</h4>
      <p>
        Hãy bắt đầu hành trình chinh phục kiến thức bằng cách tạo bài
        kiểm tra đầu tiên của bạn!
      </p>

    </div>
  );

  return (
    <>
      <TestListContainer
        title="Bài kiểm tra của tôi"
        label="QUẢN LÝ ĐỀ THI"
        actionText="Tạo đề thi mới"
        actionIcon={IoAdd}
        onAction={() => setShowCreateModal(true)}
        tests={tests}
        countdowns={countdowns}
        handleDeleteTest={handleDeleteTest}
        onRefresh={invalidateMyTests}
        emptyState={emptyState}
        footer={
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onChange={setCurrentPage}
          />
        }
      />

      <CreateTestModal
        show={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          setCurrentPage(0);
          invalidateMyTests();
        }}
        mode="personal"
      />

      <ConfirmDeleteModal
        show={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setTestToDelete(null);
        }}
        onConfirm={handleConfirmDeleteTest}
        title="Xác nhận xóa bài kiểm tra"
        message={`Bạn có chắc chắn muốn xóa bài kiểm tra "${testToDelete?.title || 'này'
          }"? Hành động này không thể hoàn tác.`}
      />
    </>
  );
}

export default MyTestPage;
