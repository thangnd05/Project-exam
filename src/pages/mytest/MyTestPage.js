import axios from 'axios';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Spinner } from 'react-bootstrap';
import classNames from 'classnames/bind';
import {
  IoAdd,
  IoDocumentTextOutline,
} from 'react-icons/io5';

import styles from './MyTestPage.module.scss';
import { useAuth } from '../../hook/useAuth';
import PageHeader from '~/components/common/PageHeader/PageHeader';
import CreateTestModal from '~/components/modals/CreateTestModal';
import TestCard from '~/components/common/TestCard/TestCard';
import TestManagementTable from '~/components/common/TestManagementTable/TestManagementTable';
import { IoListOutline, IoGridOutline } from 'react-icons/io5';
import { toast } from 'react-toastify';

const cx = classNames.bind(styles);

function MyTestPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [countdowns, setCountdowns] = useState({});
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'table'

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
          toast.success('Xóa bài kiểm tra thành công!');
          fetchTests();
        })
        .catch((err) => {
          console.error('❌ Lỗi xóa bài test:', err);
          toast.error('Không thể xóa bài kiểm tra. Vui lòng thử lại.');
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

  // Removed local start logic as it's now in TestCard

  if (loading) {
    return (
      <div className={cx('loading-box')}>
        <Spinner animation="grow" variant="primary" size="lg" />
        <p>Đang tải bộ sưu tập đề thi...</p>
      </div>
    );
  }

  return (
    <div className={cx('wrapper')}>
      <Container>
        <PageHeader
          title="Bài kiểm tra của tôi"
          label="QUẢN LÝ ĐỀ THI"
          actionText="Tạo đề thi mới"
          actionIcon={IoAdd}
          onAction={() => setShowCreateModal(true)}
        >
          <div className={cx('view-toggle')}>
            <button
              className={cx('toggle-btn', { active: viewMode === 'grid' })}
              onClick={() => setViewMode('grid')}
              title="Dạng lưới"
            >
              <IoGridOutline />
            </button>
            <button
              className={cx('toggle-btn', { active: viewMode === 'table' })}
              onClick={() => setViewMode('table')}
              title="Quản lý chi tiết (Dạng bảng)"
            >
              <IoListOutline />
            </button>
          </div>
        </PageHeader>

        <div className={cx('content-section')}>
          {tests.length > 0 ? (
            viewMode === 'grid' ? (
              <div className={cx('test-grid')}>
                {tests.map((test) => (
                  <TestCard key={test.testId} test={test} countdowns={countdowns} />
                ))}
              </div>
            ) : (
              <TestManagementTable tests={tests} onDelete={handleDeleteTest} />
            )
          ) : (
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
          )}
        </div>
      </Container>

      <CreateTestModal
        show={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={fetchTests}
        mode="personal"
      />
    </div>
  );
}

export default MyTestPage;
