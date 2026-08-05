import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {useQuery} from '@tanstack/react-query';
import classNames from 'classnames/bind';
import {motion} from 'framer-motion';

import styles from './HeroSection.module.scss';
import {calculateAllowedTime} from '~/shared/utils/testStatusHelper';
import {useQuickChallengeTests} from '~/features/landing/components/HeroSection/hooks/useQuickChallengeTests';
import QuickTestOrbit from './QuickTestOrbit';
import {getStandardExamTypes} from '~/shared/api/examTypeApi';
import {examTypeKeys} from '~/features/tests/exam/exam-types/examTypeKeys';
import {name as brandName} from '~/shared/assets/images';

const cx = classNames.bind(styles);

const normalizeExamTypes = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (payload && Array.isArray(payload.data)) return payload.data;
  if (payload && Array.isArray(payload.content)) return payload.content;
  return [];
};

function HeroSection() {
  const navigate = useNavigate();
  const {quickTests, isLoading: loading} = useQuickChallengeTests();
  const [activeIdx, setActiveIdx] = useState(0);
  const orbitRef = useRef(null);

  const {data: examTypeCount = 0} = useQuery({
    queryKey: examTypeKeys.standard,
    queryFn: getStandardExamTypes,
    select: (payload) =>
      normalizeExamTypes(payload).filter((t) => !t.parentId).length,
  });

  const cards = useMemo(() => {
    const seen = new Set();
    const out = [];
    quickTests.forEach((t) => {
      const key = t.examTypeId ?? '__none__';
      if (!seen.has(key)) {
        seen.add(key);
        out.push(t);
      }
    });
    return out;
  }, [quickTests]);

  useEffect(() => {
    if (activeIdx >= cards.length) setActiveIdx(0);
  }, [cards.length, activeIdx]);

  const active = cards[activeIdx] ?? null;
  const hasQuick = !loading && Boolean(active);

  const handleScrollToExam = () => {
    document.getElementById('exam-types')?.scrollIntoView({behavior: 'smooth'});
  };

  const startTest = useCallback(
    (test) => {
      navigate(`/tests/${test.testId}/start`, {
        state: {allowedTime: calculateAllowedTime(test)},
      });
    },
    [navigate],
  );

  const handleStartQuick = useCallback(() => {
    if (!active) {
      handleScrollToExam();
      return;
    }
    startTest(active);
  }, [active, startTest]);

  const goPrev = () => orbitRef.current?.goPrev();
  const goNext = () => orbitRef.current?.goNext();

  const handleScrollDown = () => {
    window.scrollTo({top: window.innerHeight, behavior: 'smooth'});
  };

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
            Từ hôm nay đến ngày thi
            <br />
            <span className={cx('accent')}>lộ trình</span> dành riêng bạn
          </h1>
          <p className={cx('lede')}>
            Thử kiểm tra nhanh để lộ điểm yếu và ôn theo lộ trình sát đề thật.
          </p>
          <div className={cx('ctaBlock')}>
            <div className={cx('actions')}>
              <button type="button" className={cx('btnPrimary')} onClick={handleStartQuick}>
                {hasQuick ? 'Làm kiểm tra nhanh' : 'Khám phá kỳ thi'}
              </button>
              {hasQuick && (
                <button type="button" className={cx('btnGhost')} onClick={handleScrollToExam}>
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
              <span>Không cần đăng ký</span>
            </p>
          </div>
        </motion.div>

        <motion.div
          className={cx('stage')}
          initial={{opacity: 0, scale: 0.92}}
          animate={{opacity: 1, scale: 1}}
          transition={{duration: 1.1, delay: 0.15, ease: [0.22, 1, 0.36, 1]}}
        >
          {hasQuick ? (
            <QuickTestOrbit
              ref={orbitRef}
              tests={cards}
              onOpen={startTest}
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
        </motion.div>
      </div>

      <button
        type="button"
        className={cx('scrollCue')}
        onClick={handleScrollDown}
        aria-label="Cuộn xuống phần tiếp theo"
      >
        <span className={cx('scrollCueLabel')}>Cuộn xuống</span>
        <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path
            d="M5 7.5L10 12.5L15 7.5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </section>
  );
}

export default HeroSection;
