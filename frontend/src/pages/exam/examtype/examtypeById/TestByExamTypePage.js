import { getTestsByExamType } from '../../../../api/testApi';
import { getExamTypeById } from '../../../../api/examTypeApi';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Spinner } from 'react-bootstrap';
import classNames from 'classnames/bind';
import { FaBullseye } from 'react-icons/fa';
import { IoDocumentTextOutline } from 'react-icons/io5';
import routes from '~/config/Routes';
import { useAuth } from '../../../../hooks/useAuth';

import style from './TestByExamTypePage.module.scss';
import TestListContainer from '~/components/test/TestListContainer/TestListContainer';
import Pagination from '~/components/common/Pagination/Pagination';

const cx = classNames.bind(style);
const PAGE_SIZE = 12;

function TestByExamTypePage() {
  const { examTypeId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [tests, setTests] = useState([]);
  const [examTypeName, setExamTypeName] = useState('');
  const [loading, setLoading] = useState(true);
  const [countdowns, setCountdowns] = useState({});
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const fetchTests = useCallback(
    (page = 0) => {
      if (!examTypeId) return;
      setLoading(true);
      getTestsByExamType(examTypeId, { page, size: PAGE_SIZE })
        .then((data) => {
          setTests(Array.isArray(data?.content) ? data.content : []);
          setTotalPages(data?.totalPages ?? 0);
          setCurrentPage(data?.currentPage ?? page);
        })
        .catch(() => {
          setTests([]);
          setTotalPages(0);
        })
        .finally(() => setLoading(false));
    },
    [examTypeId]
  );

  useEffect(() => {
    if (!examTypeId) {
      setLoading(false);
      return;
    }

    fetchTests(0);

    getExamTypeById(examTypeId)
      .then((data) => setExamTypeName(data.name))
      .catch(() => { });
  }, [examTypeId, fetchTests]);

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
      <div
        className="d-flex flex-column align-items-center justify-content-center"
        style={{ minHeight: '60vh' }}
      >
        <Spinner animation="grow" variant="info" />
        <p className="mt-3 fw-bold text-info">Đang tải kho bài tập...</p>
      </div>
    );
  }

  const handleOpenTarget = () => {
    if (!user) {
      navigate(routes.login);
      return;
    }
    navigate(`${routes.myTarget}?examTypeId=${examTypeId}`);
  };

  const emptyState = (
    <div className={cx('empty-state')}>
      <IoDocumentTextOutline className={cx('icon')} />
      <h4>Bộ đề này hiện đang được soạn thảo</h4>
      <p className="text-muted">
        Vui lòng quay lại sau để trải nghiệm những thử thách mới.
      </p>
    </div>
  );

  return (
    <TestListContainer
      title={examTypeName || 'Loại bài tập'}
      label="Khám phá bộ đề"
      secondaryActionText="Mục tiêu của tôi"
      secondaryActionIcon={FaBullseye}
      onSecondaryAction={handleOpenTarget}
      tests={tests}
      countdowns={countdowns}
      emptyState={emptyState}
      footer={
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onChange={fetchTests}
        />
      }
    />
  );
}

export default TestByExamTypePage;
