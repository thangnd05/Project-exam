import axios from 'axios';
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Spinner, Button } from 'react-bootstrap';
import classNames from 'classnames/bind';
import {
  IoTimeOutline,
  IoCalendarOutline,
  IoDocumentTextOutline,
  IoAddCircleOutline
} from 'react-icons/io5';
import { toast } from 'react-toastify';

import styles from './TestByClassPage.module.scss';
import { useAuth } from '../../../hook/useAuth';
import CreateTestModal from '~/components/modals/CreateTestModal';
import PageHeader from '~/components/common/PageHeader/PageHeader';
import TestCard from '~/components/common/TestCard/TestCard';
import { formatDateTime } from '~/utils/testStatusHelper';

const cx = classNames.bind(styles);

function TestByClassPage() {
  const { classId } = useParams();
  const { chapterId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [tests, setTests] = useState([]);
  const [className, setClassName] = useState('');
  const [loading, setLoading] = useState(true);
  const [countdowns, setCountdowns] = useState({});
  const [showCreateTestModal, setShowCreateTestModal] = useState(false);

  // 🟢 Lấy thông tin lớp học
  useEffect(() => {
    if (!classId) return;
    axios
      .get(`/api/classes/${classId}`)
      .then((res) => {
        if (res.data && res.data.className) {
          setClassName(res.data.className);
        }
      })
      .catch((err) => console.error('❌ Lỗi:', err));
  }, [classId]);

  // 🟢 Lấy danh sách bài test
  const fetchTests = () => {
    if (!classId || !chapterId) return;
    setLoading(true);
    axios
      .get(`/api/classes/${classId}/chapters/${chapterId}/tests`)
      .then((res) => {
        if (Array.isArray(res.data)) {
          setTests(res.data);
        }
      })
      .catch((err) => {
        console.error('❌ Lỗi bài test:', err);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTests();
  }, [classId, chapterId]);

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

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString('vi-VN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // formatCountdown moved to TestCard

  // handleStartTest moved to TestCard

  const now = new Date();

  if (loading) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center" style={{ minHeight: '60vh' }}>
        <Spinner animation="grow" variant="primary" />
        <p className="mt-3 fw-bold text-primary">Đang tải phòng thi...</p>
      </div>
    );
  }

  return (
    <div className={cx('wrapper')}>
      <Container>
        {/* === Premium Header === */}
        <PageHeader
          title={className || 'Lớp học hiện tại'}
          label="Phòng thi của lớp"
          actionText="Tạo bài kiểm tra mới"
          actionIcon={IoAddCircleOutline}
          onAction={() => setShowCreateTestModal(true)}
        />

        {/* === Test Cards Grid === */}
        <div className={cx('test-grid')}>
          {tests.length > 0 ? (
            tests.map((test) => (
              <TestCard key={test.testId} test={test} countdowns={countdowns} />
            ))
          ) : (
            <div className={cx('empty-state')}>
              <IoDocumentTextOutline className={cx('icon')} />
              <h4>Chưa có bài kiểm tra nào được công bố</h4>
              <p className="text-muted">Giáo viên của bạn sẽ sớm cập nhật các bài thi tại đây.</p>
            </div>
          )}
        </div>
      </Container>

      {/* Modal tạo test */}
      <CreateTestModal
        show={showCreateTestModal}
        onClose={() => setShowCreateTestModal(false)}
        mode="class"
        classId={classId}
        chapterId={chapterId}
        onSuccess={() => {
          fetchTests(); // Refresh danh sách test
          setShowCreateTestModal(false);
          toast.success("Tạo bài kiểm tra mới thành công! 🎉");
        }}
      />
    </div>
  );
}

export default TestByClassPage;
