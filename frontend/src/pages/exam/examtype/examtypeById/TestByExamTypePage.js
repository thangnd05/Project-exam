import axios from '../../../../api/axiosClient';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Spinner } from 'react-bootstrap';
import classNames from 'classnames/bind';
import {
  IoDocumentTextOutline,
} from 'react-icons/io5';

import style from './TestByExamTypePage.module.scss';
import TestListContainer from '~/components/common/TestListContainer/TestListContainer';

const cx = classNames.bind(style);

function TestByExamTypePage() {
  const { examTypeId } = useParams();

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

    axios
      .get(`/api/tests/user/by-exam-type/${examTypeId}`)
      .then((res) => setTests(res.data))
      .catch(() => setTests([]))
      .finally(() => setLoading(false));

    axios
      .get(`/api/exam-types/${examTypeId}`)
      .then((res) => setExamTypeName(res.data.name))
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
      tests={tests}
      countdowns={countdowns}
      emptyState={emptyState}
    />
  );
}

export default TestByExamTypePage;
