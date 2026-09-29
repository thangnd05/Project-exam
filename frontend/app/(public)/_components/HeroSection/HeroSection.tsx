'use client';
import { useRouter } from 'next/navigation';
import {useCallback, useMemo, useState} from 'react';
import {useQuery} from '@tanstack/react-query';
import classNames from 'classnames/bind';
import {motion} from 'framer-motion';
import {getStandardExamTypes} from '@/app/apis/examTypeApi';
import {getUserTarget} from '@/app/apis/userTargetApi';
import {name as brandName} from '@/app/assets/images';
import routes from '@/app/configs/Routes';
import {useAuth} from '@/app/hooks/useAuth';
import {buildLoginUrl} from '@/app/utils/authRedirect';
import {examTypeKeys} from '@/app/hooks/examTypeKeys';
import type {ExamTypeResponse} from '@/app/types/exam-type';
import type {QuickChallengeCardResponse} from '@/app/types/test';
import styles from './HeroSection.module.scss';
import {useQuickChallengeTests} from './hooks/useQuickChallengeTests';
import QuickLeaderboard from './QuickLeaderboard';
import QuickTestConfirmModal from './QuickTestConfirmModal';
// Tạm ẩn vòng đề kiểm tra nhanh.
// import QuickTestOrbit, {type QuickTestOrbitHandle} from './QuickTestOrbit';
import QuickTestPickerModal from './QuickTestPickerModal';

const cx = classNames.bind(styles);

const normalizeExamTypes = (payload: any): ExamTypeResponse[] => {
  if (Array.isArray(payload)) return payload;
  if (payload && Array.isArray(payload.data)) return payload.data;
  if (payload && Array.isArray(payload.content)) return payload.content;
  return [];
};

function HeroSection() {
  const router = useRouter();
  const {isAuthenticated, loading: authLoading} = useAuth();
  const {quickTests, isLoading: loading} = useQuickChallengeTests();
  // const [activeIdx, setActiveIdx] = useState(0);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pendingTest, setPendingTest] = useState<QuickChallengeCardResponse | null>(null);
  // const orbitRef = useRef<QuickTestOrbitHandle | null>(null);

  const {data: examTypeCount = 0} = useQuery({
    queryKey: examTypeKeys.standard,
    queryFn: getStandardExamTypes,
    select: (payload) =>
      normalizeExamTypes(payload).filter((t) => !t.parentId).length,
  });

  const cards = useMemo(() => {
    const seen = new Set<string>();
    const out: QuickChallengeCardResponse[] = [];
    quickTests.forEach((t) => {
      const key = t.examTypeId ?? '__none__';
      if (!seen.has(key)) {
        seen.add(key);
        out.push(t);
      }
    });
    return out;
  }, [quickTests]);

  // useEffect(() => {
  //   if (activeIdx >= cards.length) setActiveIdx(0);
  // }, [cards.length, activeIdx]);

  const active = cards[0] ?? null;
  const hasQuick = !loading && Boolean(active);

  const goToExamTypes = useCallback(() => {
    router.push(routes.examTypes);
  }, [router]);

  const startTest = useCallback(
    (test: QuickChallengeCardResponse) => {
      router.push(`/tests/${test.testId}/start`);
    },
    [router],
  );

  const requestStart = useCallback((test: QuickChallengeCardResponse | null) => {
    if (!test) return;
    setPendingTest(test);
  }, []);

  const closePicker = useCallback(() => {
    setPickerOpen(false);
  }, []);

  const closeConfirm = useCallback(() => {
    setPendingTest(null);
  }, []);

  const confirmStart = useCallback(
    (test: QuickChallengeCardResponse) => {
      setPendingTest(null);
      startTest(test);
    },
    [startTest],
  );

  const startSyllabusPlan = useCallback(
    async (test: QuickChallengeCardResponse) => {
      setPendingTest(null);
      const examTypeId = test.examTypeId;
      if (!examTypeId) {
        router.push(routes.examTypes);
        return;
      }

      const planUrl = `${routes.generatePlan}?${new URLSearchParams({
        examTypeId,
        source: 'syllabus',
      }).toString()}`;

      const targetUrl = `${routes.myTarget}?${new URLSearchParams({
        examTypeId,
        next: planUrl,
      }).toString()}`;

      // Khách đăng nhập trước, xong quay về đúng bước đặt mục tiêu rồi sinh lộ trình.
      if (!authLoading && !isAuthenticated) {
        router.push(buildLoginUrl(targetUrl, {
          flash: 'Đăng nhập để xây lộ trình cá nhân hóa cho kỳ thi này.',
        }));
        return;
      }

      // Chưa có mục tiêu thì đặt trước, xong quay lại đúng bước sinh lộ trình.
      try {
        const target = await getUserTarget(examTypeId);
        if (!target?.hasTarget) {
          router.push(targetUrl);
          return;
        }
      } catch {
        // Không kiểm tra được mục tiêu thì cứ sang trang sinh lộ trình, ở đó vẫn xử lý được.
      }
      router.push(planUrl);
    },
    [router, isAuthenticated, authLoading],
  );

  const handleStartQuick = useCallback(() => {
    if (loading || quickTests.length > 0) {
      setPickerOpen(true);
      return;
    }
    goToExamTypes();
  }, [loading, quickTests.length, goToExamTypes]);

  const handlePickTest = useCallback(
    (test: QuickChallengeCardResponse) => {
      setPickerOpen(false);
      requestStart(test);
    },
    [requestStart],
  );

  // const goPrev = () => orbitRef.current?.goPrev();
  // const goNext = () => orbitRef.current?.goNext();

  return (
    <section id="hero" className={cx('hero')}>
      <div className={cx('atmosphere')} aria-hidden="true">
        <span className={cx('orb', 'orbA')} />
        <span className={cx('orb', 'orbB')} />
      </div>

      <div className={cx('shell')}>
        <motion.div
          className={cx('copy')}
          initial={{opacity: 0, y: 32}}
          animate={{opacity: 1, y: 0}}
          transition={{duration: 0.9, ease: [0.22, 1, 0.36, 1]}}
        >
          <p className={cx('brand')}>{brandName}</p>
          <h1 className={cx('headline')}>
            Luyện thi chứng chỉ AWS
            <br />
            theo <span className={cx('accent')}>lộ trình</span> dành riêng bạn
          </h1>
          <p className={cx('lede')}>
            Làm bài kiểm tra nhanh để biết điểm yếu, rồi ôn theo lộ trình sát đề thật.
          </p>
          <div className={cx('ctaBlock')}>
            <div className={cx('actions')}>
              <button type="button" className={cx('btnPrimary')} onClick={handleStartQuick}>
                {hasQuick ? 'Làm kiểm tra nhanh' : 'Khám phá kỳ thi'}
              </button>
              {hasQuick && (
                <button type="button" className={cx('btnGhost')} onClick={goToExamTypes}>
                  Khám phá kỳ thi
                </button>
              )}
            </div>
            <p className={cx('trustLine')}>
              {examTypeCount > 0 && (
                <>
                  <span>{examTypeCount} kỳ thi</span>
                  <span className={cx('trustSep')} aria-hidden="true">
                    ·
                  </span>
                </>
              )}
              <span>Đăng ký miễn phí</span>
            </p>
          </div>
        </motion.div>

        <motion.div
          className={cx('stage', 'stageBoard')}
          initial={{opacity: 0, scale: 0.92}}
          animate={{opacity: 1, scale: 1}}
          transition={{duration: 1.1, delay: 0.15, ease: [0.22, 1, 0.36, 1]}}
        >
          <QuickLeaderboard />
          {/* Tạm ẩn vòng đề kiểm tra nhanh.
          {hasQuick ? (
            <QuickTestOrbit
              ref={orbitRef}
              tests={cards}
              onOpen={requestStart}
              onFrontChange={setActiveIdx}
            />
          ) : (
            <p className={cx('stageEmpty')}>
              {loading ? 'Đang tải đề kiểm tra nhanh…' : 'Sẵn sàng khám phá'}
            </p>
          )}

          {cards.length > 1 && (
            <div className={cx('switcher')}>
              <button
                type="button"
                className={cx('switchBtn', 'switchPrev')}
                onClick={goPrev}
                aria-label="Trước"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <path
                    d="M12.5 4.5L7 10l5.5 5.5"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              <button
                type="button"
                className={cx('switchBtn', 'switchNext')}
                onClick={goNext}
                aria-label="Sau"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <path
                    d="M7.5 4.5L13 10l-5.5 5.5"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          )}
          */}
        </motion.div>
      </div>

      <QuickTestPickerModal
        show={pickerOpen}
        tests={quickTests}
        loading={loading}
        onClose={closePicker}
        onSelect={handlePickTest}
      />

      <QuickTestConfirmModal
        show={Boolean(pendingTest)}
        test={pendingTest}
        onClose={closeConfirm}
        onConfirm={confirmStart}
        onStartSyllabusPlan={startSyllabusPlan}
        isGuest={!authLoading && !isAuthenticated}
      />
    </section>
  );
}

export default HeroSection;
