import axios from '../../api/axiosClient';
import { useEffect, useState } from 'react';
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
import CreateTestModal from '~/components/modals/CreateTestModal';
import ConfirmDeleteModal from '~/components/modals/ConfirmDeleteModal';
import TestListContainer from '~/components/common/TestListContainer/TestListContainer';

const cx = classNames.bind(styles);

function MyTestPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [countdowns, setCountdowns] = useState({});
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [testToDelete, setTestToDelete] = useState(null);

  const fetchTests = () => {
    setLoading(true);
    axios
      .get('/api/tests/my-tests')
      .then((res) => {
        if (Array.isArray(res.data)) setTests(res.data);
        else setTests([]);
      })
      .catch((err) => {
        console.error(' Lỗi:', err);
        setTests([]);
      })
      .finally(() => setLoading(false));
  };

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
      await axios.delete(`/api/tests/${testToDelete.testId}`);
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
    if (!user) {
      navigate('/login');
      return;
    }
    fetchTests();
  }, [user, navigate]);

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
        onRefresh={fetchTests}
        emptyState={emptyState}
      />

      <CreateTestModal
        show={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={fetchTests}
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
