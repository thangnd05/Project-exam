import { getTestsByExamType, getTestCollectionsByExamType } from '../../../../api/testApi';
import { getExamTypeById, getExamTypeChildren } from '../../../../api/examTypeApi';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Spinner } from 'react-bootstrap';
import classNames from 'classnames/bind';
import { FaBullseye } from 'react-icons/fa';
import { IoDocumentTextOutline, IoFolderOpenOutline, IoChevronForward, IoSchoolOutline } from 'react-icons/io5';
import routes, { buildExamTypeCollectionPath, buildExamTypeDetailPath } from '~/config/Routes';
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
  const [folders, setFolders] = useState([]);
  const [children, setChildren] = useState([]);

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

    getTestCollectionsByExamType(examTypeId)
      .then((data) => setFolders(Array.isArray(data) ? data : []))
      .catch(() => setFolders([]));

    // Nếu đây là loại kỳ thi cha (vd AWS) → có các loại con (cert) để drill-in.
    getExamTypeChildren(examTypeId)
      .then((data) => setChildren(Array.isArray(data) ? data : []))
      .catch(() => setChildren([]));
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

  // Loại kỳ thi cha (vd AWS) → hiện danh sách kỳ thi con (cert) để chọn, không hiện test.
  if (children.length > 0) {
    const childrenGrid = (
      <div className={cx('folder-section')}>
        <div className={cx('folder-section-title')}>
          <IoSchoolOutline /> Các kỳ thi
        </div>
        <div className={cx('folder-grid')}>
          {children.map((child) => (
            <button
              key={child.examTypeId}
              type="button"
              className={cx('folder-card')}
              onClick={() => navigate(buildExamTypeDetailPath(child.examTypeId))}
            >
              <span className={cx('folder-card-icon')}>
                <IoSchoolOutline />
              </span>
              <span className={cx('folder-card-body')}>
                <span className={cx('folder-card-name')}>{child.name}</span>
                {child.description && (
                  <span className={cx('folder-card-count')}>{child.description}</span>
                )}
              </span>
              <IoChevronForward className={cx('folder-card-arrow')} />
            </button>
          ))}
        </div>
      </div>
    );

    return (
      <TestListContainer
        title={examTypeName || 'Loại kỳ thi'}
        label="Chọn kỳ thi"
        tests={[]}
        emptyState={<></>}
        topSlot={childrenGrid}
      />
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

  const folderSection = folders.length > 0 && (
    <div className={cx('folder-section')}>
      <div className={cx('folder-section-title')}>
        <IoFolderOpenOutline /> Bộ đề
      </div>
      <div className={cx('folder-grid')}>
        {folders.map((folder) => (
          <button
            key={folder.collectionId}
            type="button"
            className={cx('folder-card')}
            onClick={() => navigate(buildExamTypeCollectionPath(examTypeId, folder.collectionId))}
          >
            <span className={cx('folder-card-icon')}>
              <IoFolderOpenOutline />
            </span>
            <span className={cx('folder-card-body')}>
              <span className={cx('folder-card-name')}>{folder.name}</span>
              <span className={cx('folder-card-count')}>{folder.testCount} đề</span>
            </span>
            <IoChevronForward className={cx('folder-card-arrow')} />
          </button>
        ))}
      </div>
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
      topSlot={folderSection}
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
