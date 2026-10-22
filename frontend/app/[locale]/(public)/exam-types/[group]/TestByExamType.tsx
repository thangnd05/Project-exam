'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { Container } from 'react-bootstrap';
import classNamesBind from 'classnames/bind';
import { FiArrowRight, FiChevronRight } from 'react-icons/fi';
import {
  IoBookOutline,
  IoChevronDown,
  IoDocumentTextOutline,
  IoFlagOutline,
  IoRibbonOutline,
} from 'react-icons/io5';
import { buildLoginUrlFromHere } from '@/app/features/auth/authRedirect';
import routes, { buildExamTypeDetailPath } from '@/app/configs/Routes';
import { useAuth } from '@/app/hooks/useAuth';
import { withExam } from '@/app/features/exam-types/hooks/useExamParam';
import Pagination from '@/app/components/Pagination/Pagination';
import ExamBadge from '@/app/(public)/_components/ExamBadge/ExamBadge';
import QuickTestConfirmModal from '@/app/(public)/_components/HeroSection/QuickTestConfirmModal';
import { useQuickChallengeTests } from '@/app/(public)/_components/HeroSection/hooks/useQuickChallengeTests';
import { useQuickTestLauncher } from '@/app/(public)/_components/HeroSection/hooks/useQuickTestLauncher';
import { FULL_QUESTIONS, badgeUrl, formatFullSpec, parseCode } from '@/app/(public)/_lib/certificationMeta';
import type { ExamTypeResponse, TestResponse } from '@/app/types';
import MockTestCard from './_components/MockTestCard';
import { useTestsByExamType } from './_hooks/useTestsByExamType';
import uiStyles from '@/app/assets/styles/FlatUi.module.scss';
import styles from './TestByExamType.module.scss';

const cx = classNamesBind.bind(styles);
const ui = classNamesBind.bind(uiStyles);

const PAGE_SIZE = 12;

const stripCode = (name: string) => name.replace(/\s*\([^)]*\)\s*$/, '');

function ExamCard({ exam }: { exam: ExamTypeResponse }) {
  const name = exam.name?.trim() ?? '';
  const code = parseCode(name);
  return (
    <Link href={buildExamTypeDetailPath(exam)} className={cx('childCard')}>
      <ExamBadge sources={[badgeUrl(name, code), exam.imageUrl]} name={name} size={48} />
      <span className={cx('childText')}>
        {code && <span className={cx('code')}>{code}</span>}
        <span className={cx('childName')}>{stripCode(name) || code}</span>
        {exam.description && <span className={cx('childDesc')}>{exam.description}</span>}
      </span>
      <FiChevronRight className={cx('childArrow')} aria-hidden="true" />
    </Link>
  );
}

function TestGrid({
  tests,
  startIndex,
  kind,
  questions,
  countdowns,
}: {
  tests: TestResponse[];
  startIndex: number;
  kind: string;
  questions?: number;
  countdowns: Record<string, number>;
}) {
  return (
    <div className={cx('testGrid')}>
      {tests.map((test, i) => (
        <MockTestCard
          key={test.testId}
          test={test}
          index={startIndex + i + 1}
          kind={kind}
          questions={questions}
          countdowns={countdowns}
        />
      ))}
    </div>
  );
}

// examTypeId do server tra từ slug trên URL (/exam-types/aws/saa-c03) rồi truyền xuống.
function TestByExamType({ examTypeId, examSlug }: { examTypeId: string; examSlug?: string }) {
  const router = useRouter();
  const { user } = useAuth();

  const [countdowns, setCountdowns] = useState<Record<string, number>>({});
  const [currentPage, setCurrentPage] = useState(0);
  const [certificateOpen, setCertificateOpen] = useState(false);

  const { tests, totalPages, totalElements, examType, examTypeName, children, certificateExam, isLoading } =
    useTestsByExamType(examTypeId, currentPage);

  const { quickTests } = useQuickChallengeTests();
  const { pendingTest, requestStart, closeConfirm, confirmStart, startSyllabusPlan, isGuest } =
    useQuickTestLauncher();
  const quick = useMemo(
    () => quickTests.find((test) => test.examTypeId === examTypeId) ?? null,
    [quickTests, examTypeId],
  );

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

  const name = examTypeName.trim();
  const code = parseCode(name);
  const title = stripCode(name) || code || 'Kỳ thi';
  const fullQuestions = FULL_QUESTIONS[code];

  const handleOpenTarget = () => {
    if (!user) {
      router.push(buildLoginUrlFromHere());
      return;
    }
    router.push(withExam(routes.myTarget, examTypeId, [{ examTypeId, slug: examSlug }]));
  };

  const breadcrumb = (
    <nav className={cx('breadcrumb')} aria-label="Đường dẫn">
      <Link href={routes.examTypes}>Kho đề thi</Link>
      {examType?.parentName && (
        <>
          <FiChevronRight aria-hidden="true" />
          <span>{examType.parentName}</span>
        </>
      )}
      <FiChevronRight aria-hidden="true" />
      <span aria-current="page">{code || title}</span>
    </nav>
  );

  const loadingView = (
    <>
      <div className={cx('heroSkeleton')} aria-hidden="true" />
      <div className={ui('skeleton')} aria-hidden="true" />
    </>
  );

  // Nhóm cha (/exam-types/aws): chỉ liệt kê các kỳ thi con.
  if (children.length > 0) {
    return (
      <div className={cx('wrapper')}>
        <Container>
          {breadcrumb}
          <header className={cx('groupHead')}>
            <span className={ui('eyebrow')}>Chọn kỳ thi</span>
            <h1 className={cx('title')}>{name || 'Nhóm kỳ thi'}</h1>
          </header>
          <div className={cx('childGrid')}>
            {children.map((child) => (
              <ExamCard key={child.examTypeId} exam={child} />
            ))}
          </div>
        </Container>
      </div>
    );
  }

  const certificateTests = certificateExam?.tests ?? [];

  return (
    <div className={cx('wrapper')}>
      <Container>
        {breadcrumb}

        {isLoading && tests.length === 0 && !name ? (
          loadingView
        ) : (
          <>
            <header className={cx('hero')}>
              <ExamBadge
                sources={[badgeUrl(name, code), examType?.imageUrl]}
                name={title}
                size={72}
              />
              <div className={cx('heroText')}>
                {code && <span className={cx('code')}>{code}</span>}
                <h1 className={cx('title')}>{title}</h1>
                {examType?.description && <p className={cx('desc')}>{examType.description}</p>}
                <div className={cx('stats')}>
                  <span>
                    Quick: <strong>{quick ? `${quick.totalQuestions} câu${quick.durationMinutes ? ` / ${quick.durationMinutes}p` : ''}` : 'Chưa có'}</strong>
                  </span>
                  <span>
                    Full: <strong>{formatFullSpec(examType?.durationMinutes, code)}</strong>
                  </span>
                  <span>
                    Đề Full Mock: <strong>{totalElements}</strong>
                  </span>
                </div>
                <div className={cx('heroActions')}>
                  <button
                    type="button"
                    className={ui('btnPrimary')}
                    onClick={() => requestStart(quick)}
                    disabled={!quick}
                    title={quick ? 'Đề ngắn để biết mình đang ở mức nào' : 'Kỳ thi này chưa có đề kiểm tra nhanh'}
                  >
                    Thi nhanh
                  </button>
                  <button type="button" className={ui('btnSecondary')} onClick={handleOpenTarget}>
                    <IoFlagOutline aria-hidden="true" />
                    Mục tiêu của tôi
                  </button>
                  <Link href={routes.resources} className={ui('btnSecondary')}>
                    <IoBookOutline aria-hidden="true" />
                    Tài liệu ôn
                  </Link>
                </div>
              </div>
            </header>

            {certificateTests.length > 0 && (
              <section className={cx('certificate', { open: certificateOpen })}>
                <button
                  type="button"
                  className={cx('certificateHead')}
                  onClick={() => setCertificateOpen((prev) => !prev)}
                  aria-expanded={certificateOpen}
                  aria-controls="certificate-exams"
                >
                  <span className={cx('certificateIcon')} aria-hidden="true">
                    <IoRibbonOutline />
                  </span>
                  <span className={cx('certificateText')}>
                    <span className={cx('certificateTitle')}>
                      Thi lấy chứng chỉ
                      <span className={ui('pill')}>{certificateTests.length} đề</span>
                      {certificateExam?.alreadyOwned && (
                        <span className={ui('pill', 'pillSuccess')}>Bạn đã có chứng chỉ này</span>
                      )}
                    </span>
                    <span className={cx('certificateDesc')}>
                      Đạt {certificateExam?.passScore} điểm để nhận
                      {certificateExam?.certificateTitle ? ` ${certificateExam.certificateTitle}` : ' chứng chỉ'}
                      {certificateExam?.validMonths ? ` (hiệu lực ${certificateExam.validMonths} tháng)` : ''}.
                    </span>
                  </span>
                  <IoChevronDown className={cx('chevron')} aria-hidden="true" />
                </button>
                {certificateOpen && (
                  <div id="certificate-exams" className={cx('certificateBody')}>
                    <TestGrid
                      tests={certificateTests}
                      startIndex={0}
                      kind="Chứng chỉ"
                      questions={fullQuestions}
                      countdowns={countdowns}
                    />
                  </div>
                )}
              </section>
            )}

            <section aria-labelledby="mock-tests-title">
              <div className={cx('sectionHead')}>
                <h2 id="mock-tests-title" className={cx('sectionTitle')}>
                  Đề Full Mock
                </h2>
                <span className={cx('sectionCount')}>{totalElements}</span>
                <span className={cx('sectionDesc')}>Mô phỏng đề thật: đủ số câu, đủ thời gian.</span>
              </div>

              {tests.length > 0 ? (
                <>
                  <TestGrid
                    tests={tests}
                    startIndex={currentPage * PAGE_SIZE}
                    kind="Full Mock"
                    questions={fullQuestions}
                    countdowns={countdowns}
                  />
                  {totalPages > 1 && (
                    <Pagination currentPage={currentPage} totalPages={totalPages} onChange={setCurrentPage} />
                  )}
                </>
              ) : (
                <div className={ui('empty')}>
                  <IoDocumentTextOutline className={ui('emptyIcon')} aria-hidden="true" />
                  <h3>Chưa có đề Full Mock</h3>
                  <p>Đề sẽ xuất hiện ở đây khi được thêm vào kỳ thi này. Trong lúc chờ, thử làm đề nhanh.</p>
                  {quick && (
                    <button type="button" className={ui('btnPrimary')} onClick={() => requestStart(quick)}>
                      Thi nhanh
                      <FiArrowRight aria-hidden="true" />
                    </button>
                  )}
                </div>
              )}
            </section>
          </>
        )}
      </Container>

      <QuickTestConfirmModal
        show={Boolean(pendingTest)}
        test={pendingTest}
        onClose={closeConfirm}
        onConfirm={confirmStart}
        onStartSyllabusPlan={startSyllabusPlan}
        isGuest={isGuest}
      />
    </div>
  );
}

export default TestByExamType;
