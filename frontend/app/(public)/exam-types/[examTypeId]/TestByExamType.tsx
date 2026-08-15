'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Spinner } from 'react-bootstrap';
import classNames from 'classnames/bind';
import { FaBullseye } from 'react-icons/fa';
import {
  IoDocumentTextOutline,
  IoFolderOpenOutline,
  IoChevronForward,
  IoSchoolOutline,
  IoRibbonOutline,
  IoChevronDown,
} from 'react-icons/io5';
import TestCard from '@/app/components/tests/TestCard/TestCard';
import routes, { buildExamTypeCollectionPath, buildExamTypeDetailPath } from '@/app/configs/Routes';
import { useAuth } from '@/app/hooks/useAuth';

import style from './TestByExamType.module.scss';
import TestListContainer from '@/app/components/tests/TestListContainer/TestListContainer';
import Pagination from '@/app/components/Pagination/Pagination';
import { useTestsByExamType } from './_hooks/useTestsByExamType';

const cx = classNames.bind(style);

function TestByExamType() {
  const { examTypeId } = useParams<{ examTypeId: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const [countdowns, setCountdowns] = useState<Record<string, number>>({});
  const [currentPage, setCurrentPage] = useState(0);
  const [certificateOpen, setCertificateOpen] = useState(false);

  const { tests, totalPages, examTypeName, folders, children, certificateExam, isLoading } =
    useTestsByExamType(examTypeId, currentPage);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const updated: Record<string, number> = {};

      tests.forEach((t) => {
        if (t.availableFrom) {
          const diff = new Date(t.availableFrom).getTime() - now.getTime();
          if (diff > 0) updated[t.testId] = diff;
        }
      });

      setCountdowns(updated);
    }, 1000);

    return () => clearInterval(interval);
  }, [tests]);

  if (isLoading && tests.length === 0 && currentPage === 0 && totalPages === 0) {
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
              onClick={() => router.push(buildExamTypeDetailPath(child.examTypeId))}
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
      router.push(routes.login);
      return;
    }
    router.push(`${routes.myTarget}?examTypeId=${examTypeId}`);
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

  /*
    Khu thi lấy chứng chỉ tách khỏi danh sách đề thường (backend đã loại các đề này khỏi
    danh sách phẳng) để người học thấy ngay đích cuối của loại đề. Backend trả mảng rỗng
    khi loại đề chưa có mẫu chứng chỉ đang bật, lúc đó khu này tự ẩn.
  */
  const certificateTests = certificateExam?.tests ?? [];
  const certificateSection = certificateTests.length > 0 && (
    <div className={cx('certificate-section', { open: certificateOpen })}>
      {/* Mặc định đóng: phần lớn lượt vào trang là để luyện đề, thi lấy chứng chỉ chỉ mở khi cần. */}
      <button
        type="button"
        className={cx('certificate-head')}
        onClick={() => setCertificateOpen((prev) => !prev)}
        aria-expanded={certificateOpen}
        aria-controls="certificate-exams"
      >
        <span className={cx('certificate-icon')}>
          <IoRibbonOutline />
        </span>
        <span className={cx('certificate-heading')}>
          <span className={cx('certificate-title')}>
            Thi lấy chứng chỉ
            <span className={cx('certificate-count')}>{certificateTests.length} đề</span>
          </span>
          <span className={cx('certificate-desc')}>
            Đạt {certificateExam?.passScore} điểm để nhận
            {certificateExam?.certificateTitle ? ` ${certificateExam.certificateTitle}` : ' chứng chỉ'}
            {certificateExam?.validMonths
              ? ` (hiệu lực ${certificateExam.validMonths} tháng)`
              : ''}
            .
          </span>
        </span>
        {certificateExam?.alreadyOwned && (
          <span className={cx('certificate-owned')}>Bạn đã có chứng chỉ này</span>
        )}
        <IoChevronDown className={cx('certificate-chevron')} />
      </button>

      {certificateOpen && (
        <div className={cx('certificate-grid')} id="certificate-exams">
          {certificateTests.map((test) => (
            <TestCard key={test.testId} test={test} countdowns={countdowns} />
          ))}
        </div>
      )}
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
            onClick={() => router.push(buildExamTypeCollectionPath(examTypeId, folder.collectionId))}
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
      topSlot={
        (certificateSection || folderSection) && (
          <>
            {certificateSection}
            {folderSection}
          </>
        )
      }
      footer={
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onChange={setCurrentPage}
        />
      }
    />
  );
}

export default TestByExamType;
