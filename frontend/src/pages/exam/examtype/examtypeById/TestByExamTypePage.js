import { getTestsByExamType } from '../../../../api/testApi';
import { getExamTypeById } from '../../../../api/examTypeApi';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Spinner } from 'react-bootstrap';
import classNames from 'classnames/bind';
import { FaBullseye } from 'react-icons/fa';
import { IoDocumentTextOutline } from 'react-icons/io5';
import routes from '~/config/Routes';
import { useAuth } from '../../../../hooks/useAuth';

import style from './TestByExamTypePage.module.scss';
import TestListContainer from '~/components/test/TestListContainer/TestListContainer';

const cx = classNames.bind(style);

function TestByExamTypePage() {
  const { examTypeId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [tests, setTests] = useState([]);
  const [examTypeName, setExamTypeName] = useState('');
  const [loading, setLoading] = useState(true);
  const [countdowns, setCountdowns] = useState({});

  useEffect(() => {
    if (!examTypeId) {
      setLoading(false);
      return;
    }

    setLoading(true);

    getTestsByExamType(examTypeId)
      .then((data) => setTests(data))
      .catch(() => setTests([]))
      .finally(() => setLoading(false));

    getExamTypeById(examTypeId)
      .then((data) => setExamTypeName(data.name))
      .catch(() => { });
  }, [examTypeId]);

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
    />
  );
}

export default TestByExamTypePage;
