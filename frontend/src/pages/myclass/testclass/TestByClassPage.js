import { getClassById, getClassChapterTests } from '../../../api/classApi';
import { deleteTest } from '../../../api/testApi';
import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Spinner } from 'react-bootstrap';
import classNames from 'classnames/bind';
import { IoDocumentTextOutline, IoAddCircleOutline } from 'react-icons/io5';
import { toast } from 'react-toastify';

import styles from './TestByClassPage.module.scss';
import CreateTestModal from '~/components/test/CreateTestModal';
import ConfirmDeleteModal from '~/components/common/modal/ConfirmDeleteModal';
import TestListContainer from '~/components/test/TestListContainer/TestListContainer';

const cx = classNames.bind(styles);

function TestByClassPage() {
  const { classId, chapterId } = useParams();
  const [tests, setTests] = useState([]);
  const [className, setClassName] = useState('');
  const [loading, setLoading] = useState(true);
  const [countdowns, setCountdowns] = useState({});
  const [showCreateTestModal, setShowCreateTestModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [testToDelete, setTestToDelete] = useState(null);

  // 🟢 Lấy thông tin lớp học
  useEffect(() => {
    if (!classId) return;
    getClassById(classId)
      .then((data) => {
        if (data && data.className) {
          setClassName(data.className);
        }
      })
      .catch((err) => console.error(' Lỗi:', err));
  }, [classId]);

  // 🟢 Lấy danh sách bài test
  const fetchTests = useCallback(() => {
    if (!classId || !chapterId) return;
    setLoading(true);
    getClassChapterTests(classId, chapterId)
      .then((data) => {
        if (Array.isArray(data)) {
          setTests(data);
        }
      })
      .catch((err) => {
        console.error(' Lỗi bài test:', err);
      })
      .finally(() => setLoading(false));
  }, [classId, chapterId]);

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
      fetchTests();
    } catch (err) {
      console.error(' Lỗi xóa bài test:', err);
      toast.error('Không thể xóa bài kiểm tra. Vui lòng thử lại.');
    } finally {
      setShowDeleteModal(false);
      setTestToDelete(null);
    }
  };

  useEffect(() => {
    fetchTests();
  }, [fetchTests]);

  // 🕒 Countdown logic
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const updatedCountdowns = {};
      tests.forEach((test) => {
        if (test.availableFrom) {
          const diff = new Date(test.availableFrom) - now;
          if (diff > 0) updatedCountdowns[test.testId] = diff;
        }
      });
      setCountdowns(updatedCountdowns);
    }, 1000);
    return () => clearInterval(interval);
  }, [tests]);

  if (loading) {
    return (
      <div
        className="d-flex flex-column align-items-center justify-content-center"
        style={{ minHeight: '60vh' }}
      >
        <Spinner animation="grow" variant="primary" />
        <p className="mt-3 fw-bold text-primary">Đang tải phòng thi...</p>
      </div>
    );
  }

  const emptyState = (
    <div className={cx('empty-state')}>
      <IoDocumentTextOutline className={cx('icon')} />
      <h4>Chưa có bài kiểm tra nào được công bố</h4>
      <p>Giáo viên của bạn sẽ sớm cập nhật các bài thi tại đây.</p>
    </div>
  );

  return (
    <>
      <TestListContainer
        title={className || 'Lớp học hiện tại'}
        label="Phòng thi của lớp"
        actionText="Tạo bài kiểm tra mới"
        actionIcon={IoAddCircleOutline}
        onAction={() => setShowCreateTestModal(true)}
        tests={tests}
        countdowns={countdowns}
        handleDeleteTest={handleDeleteTest}
        onRefresh={fetchTests}
        emptyState={emptyState}
      />

      <CreateTestModal
        show={showCreateTestModal}
        onClose={() => setShowCreateTestModal(false)}
        mode="class"
        classId={classId}
        chapterId={chapterId}
        onSuccess={() => {
          fetchTests();
          setShowCreateTestModal(false);
          toast.success('Tạo bài kiểm tra mới thành công!');
        }}
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

export default TestByClassPage;
