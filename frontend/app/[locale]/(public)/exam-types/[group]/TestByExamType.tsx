'use client';

import Link, { useRouter } from '@/app/i18n/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Container } from 'react-bootstrap';
import classNamesBind from 'classnames/bind';
import { FiArrowRight, FiChevronRight } from 'react-icons/fi';
import {
  IoChevronDown,
  IoDocumentTextOutline,
  IoRibbonOutline,
} from 'react-icons/io5';
import { buildLoginUrlFromHere } from '@/app/features/auth/authRedirect';
import routes, { buildExamTypeDetailPath } from '@/app/configs/Routes';
import { useAuth } from '@/app/hooks/useAuth';
import { withExam } from '@/app/features/exam-types/hooks/useExamParam';
import Pagination from '@/app/components/Pagination/Pagination';
import ExamBadge from '@/app/[locale]/(public)/_components/ExamBadge/ExamBadge';
import QuickTestConfirmModal from '@/app/[locale]/(public)/_components/HeroSection/QuickTestConfirmModal';
import { useQuickChallengeTests } from '@/app/[locale]/(public)/_components/HeroSection/hooks/useQuickChallengeTests';
import { useQuickTestLauncher } from '@/app/[locale]/(public)/_components/HeroSection/hooks/useQuickTestLauncher';
import { FULL_QUESTIONS, badgeUrl, parseCode, useFormatFullSpec } from '@/app/[locale]/(public)/_lib/certificationMeta';
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
  const t = useTranslations('ExamTypes');
  const formatFullSpec = useFormatFullSpec();
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
  const title = stripCode(name) || code || t('detail.fallbackTitle');
  const fullQuestions = FULL_QUESTIONS[code];

  const quickSpec = quick
    ? `${t('spec.questions', { count: quick.totalQuestions })}${
        quick.durationMinutes ? ` / ${t('spec.minutes', { count: quick.durationMinutes })}` : ''
      }`
    : t('spec.none');

  const handleOpenTarget = () => {
    if (!user) {
      router.push(buildLoginUrlFromHere());
      return;
    }
    router.push(withExam(routes.myTarget, examTypeId, [{ examTypeId, slug: examSlug }]));
  };

  const breadcrumb = (
    <nav className={cx('breadcrumb')} aria-label={t('detail.breadcrumb')}>
      <Link href={routes.examTypes}>{t('catalog.title')}</Link>
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
            <span className={ui('eyebrow')}>{t('detail.chooseExam')}</span>
            <h1 className={cx('title')}>{name || t('detail.groupFallback')}</h1>
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
                    Quick: <strong>{quickSpec}</strong>
                  </span>
                  <span>
                    Full: <strong>{formatFullSpec(examType?.durationMinutes, code)}</strong>
                  </span>
                  <span>
                    {t('detail.fullMockCount')} <strong>{totalElements}</strong>
                  </span>
                </div>
                <div className={cx('heroActions')}>
                  <button
                    type="button"
                    className={ui('btnPrimary')}
                    onClick={() => requestStart(quick)}
                    disabled={!quick}
                    title={quick ? t('detail.quickHint') : t('noQuick')}
                  >
                    {t('quickStart')}
                  </button>
                  <button type="button" className={ui('btnSecondary')} onClick={handleOpenTarget}>
                    {t('detail.myTarget')}
                  </button>
                  <Link href={routes.resources} className={ui('btnSecondary')}>
                    {t('detail.resources')}
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
                      {t('detail.certificate.title')}
                      <span className={ui('pill')}>
                        {t('detail.certificate.count', { count: certificateTests.length })}
                      </span>
                      {certificateExam?.alreadyOwned && (
                        <span className={ui('pill', 'pillSuccess')}>{t('detail.certificate.owned')}</span>
                      )}
                    </span>
                    <span className={cx('certificateDesc')}>
                      {certificateExam?.validMonths
                        ? t('detail.certificate.rewardWithValidity', {
                            score: certificateExam.passScore ?? '',
                            title: certificateExam.certificateTitle || t('detail.certificate.genericTitle'),
                            months: certificateExam.validMonths,
                          })
                        : t('detail.certificate.reward', {
                            score: certificateExam?.passScore ?? '',
                            title: certificateExam?.certificateTitle || t('detail.certificate.genericTitle'),
                          })}
                    </span>
                  </span>
                  <IoChevronDown className={cx('chevron')} aria-hidden="true" />
                </button>
                {certificateOpen && (
                  <div id="certificate-exams" className={cx('certificateBody')}>
                    <TestGrid
                      tests={certificateTests}
                      startIndex={0}
                      kind={t('detail.certificate.kind')}
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
                  {t('fullMock')}
                </h2>
                <span className={cx('sectionCount')}>{totalElements}</span>
                <span className={cx('sectionDesc')}>{t('detail.mockDesc')}</span>
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
                  <h3>{t('detail.empty.title')}</h3>
                  <p>{t('detail.empty.desc')}</p>
                  {quick && (
                    <button type="button" className={ui('btnPrimary')} onClick={() => requestStart(quick)}>
                      {t('quickStart')}
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
