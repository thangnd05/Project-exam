import axios from 'axios';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Spinner } from 'react-bootstrap';
import classNames from 'classnames/bind';
import {
  IoAdd,
  IoDocumentTextOutline,
} from 'react-icons/io5';

import styles from './MyTestPage.module.scss';
import { useAuth } from '../../hook/useAuth';
import CreateTestModal from '~/components/modals/CreateTestModal';
import TestListContainer from '~/components/common/TestListContainer/TestListContainer';

const cx = classNames.bind(styles);

function MyTestPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [countdowns, setCountdowns] = useState({});
  const [showCreateModal, setShowCreateModal] = useState(false);

  const fetchTests = () => {
    setLoading(true);
    axios
      .get('/api/tests/my-tests')
      .then((res) => {
        if (Array.isArray(res.data)) setTests(res.data);
        else setTests([]);
      })
      .catch((err) => {
        console.error('❌ Lỗi:', err);
        setTests([]);
      })
      .finally(() => setLoading(false));
  };

  const handleDeleteTest = (testId) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa bài kiểm tra này không?')) {
      axios
        .delete(`/api/tests/${testId}`)
        .then(() => {
          fetchTests();
        })
        .catch((err) => {
          console.error('❌ Lỗi xóa bài test:', err);
        });
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
      <button
        className={cx('btn-primary-modern')}
        onClick={() => setShowCreateModal(true)}
      >
        <IoAdd size={24} />
        Tạo kiểm tra ngay
      </button>
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
    </>
  );
}

export default MyTestPage;
