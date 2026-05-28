import { getMyTests, deleteTest } from '../../api/testApi';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Spinner } from 'react-bootstrap';
import { toast } from 'react-toastify';
import classNames from 'classnames/bind';
import {
  IoAdd,
  IoDocumentTextOutline,
} from 'react-icons/io5';

import styles from './MyTestPage.module.scss';
import { useAuth } from '../../hooks/useAuth';
import CreateTestModal from '~/components/test/CreateTestModal';
import ConfirmDeleteModal from '~/components/common/modal/ConfirmDeleteModal';
import TestListContainer from '~/components/test/TestListContainer/TestListContainer';
import Pagination from '~/components/common/Pagination/Pagination';

const cx = classNames.bind(styles);
const PAGE_SIZE = 12;

function MyTestPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [countdowns, setCountdowns] = useState({});
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [testToDelete, setTestToDelete] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const fetchTests = useCallback((page = 0) => {
    setLoading(true);
    getMyTests({ page, size: PAGE_SIZE })
      .then((data) => {
        setTests(Array.isArray(data?.content) ? data.content : []);
        setTotalPages(data?.totalPages ?? 0);
        setCurrentPage(data?.currentPage ?? page);
      })
      .catch((err) => {
        console.error(' Lỗi:', err);
        setTests([]);
        setTotalPages(0);
      })
      .finally(() => setLoading(false));
  }, []);

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
      await deleteTest(testToDelete.testId);
      toast.success('Xóa bài kiểm tra thành công!');
      // Sau khi xóa, nếu trang hiện tại còn 1 item (sẽ trống sau xóa) thì lùi về trang trước.
      const nextPage =
        tests.length === 1 && currentPage > 0 ? currentPage - 1 : currentPage;
      fetchTests(nextPage);
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
      navigate('/login');
      return;
    }
    fetchTests(0);
  }, [user, navigate, fetchTests]);

  // Countdown realtime
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

  if (loading && tests.length === 0 && currentPage === 0 && totalPages === 0) {
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
        onRefresh={() => fetchTests(currentPage)}
        emptyState={emptyState}
        footer={
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onChange={fetchTests}
          />
        }
      />

      <CreateTestModal
        show={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => fetchTests(0)}
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
