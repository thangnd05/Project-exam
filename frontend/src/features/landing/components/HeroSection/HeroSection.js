import {useCallback, useEffect, useMemo, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import classNames from 'classnames/bind';
import {AnimatePresence, motion} from 'framer-motion';

import styles from './HeroSection.module.scss';
import {name} from '~/shared/assets/images';
import {calculateAllowedTime} from '~/shared/utils/testStatusHelper';
import {useQuickChallengeTests} from './hooks/useQuickChallengeTests';
import {brandColors} from '~/shared/styles/brandColors';

const cx = classNames.bind(styles);

const COLOR_DARK = brandColors.primary;
const COLOR_LIGHT = brandColors.brand300;
const partColor = (idx) => (idx % 2 === 0 ? COLOR_DARK : COLOR_LIGHT);

const buildRingGradient = (parts, total) => {
  if (!total || !parts.length) {
    return `conic-gradient(from 210deg, ${COLOR_DARK}, ${COLOR_LIGHT}, ${brandColors.unique}, ${COLOR_DARK})`;
  }
  let acc = 0;
  const stops = parts.map((part, idx) => {
    const start = (acc / total) * 100;
    acc += part.numQuestions;
    const end = (acc / total) * 100;
    return `${partColor(idx)} ${start}% ${end}%`;
  });
  return `conic-gradient(from 210deg, ${stops.join(', ')})`;
};

function HeroSection() {
  const navigate = useNavigate();
  const {quickTests, isLoading: loading} = useQuickChallengeTests();
  const [activeIdx, setActiveIdx] = useState(0);

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
  const parts = active?.parts || [];
  const total = active?.totalQuestions || 0;

  const handleScrollToExam = () => {
    document.getElementById('explore-orb')?.scrollIntoView({behavior: 'smooth'});
  };

  const handleStartQuick = useCallback(() => {
    if (!active) {
      handleScrollToExam();
      return;
    }
    navigate(`/tests/${active.testId}/start`, {
      state: {allowedTime: calculateAllowedTime(active)},
    });
  }, [active, navigate]);

  const goPrev = () => {
    if (cards.length < 2) return;
    setActiveIdx((i) => (i - 1 + cards.length) % cards.length);
  };

  const goNext = () => {
    if (cards.length < 2) return;
    setActiveIdx((i) => (i + 1) % cards.length);
  };

  return (
    <section id="hero" className={cx('hero')}>
      <div className={cx('atmosphere')} aria-hidden="true">
        <span className={cx('orb', 'orbA')} />
        <span className={cx('orb', 'orbB')} />
        <span className={cx('grid')} />
        <span className={cx('scan')} />
      </div>

      <div className={cx('shell')}>
        <motion.div
          className={cx('copy')}
          initial={{opacity: 0, y: 32}}
          animate={{opacity: 1, y: 0}}
          transition={{duration: 0.9, ease: [0.22, 1, 0.36, 1]}}
        >
          <p className={cx('brand')}>{name}</p>
          <h1 className={cx('headline')}>
            Từ hôm nay đến ngày thi,
            <br />
            <span className={cx('accent')}>một lộ trình</span> dành riêng cho bạn.
          </h1>
          <p className={cx('lede')}>
            Chọn kỳ thi và mốc điểm bạn nhắm tới. {name} chẩn đoán năng lực hiện tại,
            dựng lộ trình từng ải, và kết thúc bằng bộ đề mock sát đề thật.
          </p>
          <div className={cx('ctaBlock')}>
            <div className={cx('actions')}>
              <button type="button" className={cx('btnPrimary')} onClick={handleStartQuick}>
                {hasQuick ? 'Bắt đầu kiểm tra nhanh' : 'Khám phá kỳ thi'}
              </button>
              <button type="button" className={cx('btnGhost')} onClick={handleScrollToExam}>
                Xem các kỳ thi
              </button>
            </div>
            {hasQuick && (
              <p className={cx('ctaNote')}>Miễn phí · Không cần đăng ký</p>
            )}
          </div>
        </motion.div>

        <motion.div
          className={cx('stage')}
          initial={{opacity: 0, scale: 0.92}}
          animate={{opacity: 1, scale: 1}}
          transition={{duration: 1.1, delay: 0.15, ease: [0.22, 1, 0.36, 1]}}
        >
          <div className={cx('ringWrap')}>
            <div
              className={cx('ring')}
              style={{background: buildRingGradient(parts, total)}}
            >
              <div className={cx('ringHole')}>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={active?.testId ?? 'empty'}
                    className={cx('ringCore')}
                    initial={{opacity: 0, y: 12}}
                    animate={{opacity: 1, y: 0}}
                    exit={{opacity: 0, y: -12}}
                    transition={{duration: 0.35}}
                  >
                    {loading ? (
                      <span className={cx('coreMuted')}>Đang tải…</span>
                    ) : hasQuick ? (
                      <>
                        <span className={cx('coreBadge')}>Kiểm tra nhanh</span>
                        <span className={cx('coreNum')}>{total || '—'}</span>
                        <span className={cx('coreUnit')}>câu hỏi</span>
                        <span className={cx('coreName')} title={active.examTypeName}>
                          {active.examTypeName}
                        </span>
                      </>
                    ) : (
                      <span className={cx('coreMuted')}>Sẵn sàng khám phá</span>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
            <div className={cx('ringPulse')} aria-hidden="true" />
          </div>

          {cards.length > 1 && (
            <div className={cx('switcher')}>
              <button type="button" className={cx('switchBtn')} onClick={goPrev} aria-label="Trước">
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
              <div className={cx('dots')} role="tablist" aria-label="Loại kiểm tra nhanh">
                {cards.map((c, i) => (
                  <button
                    key={c.testId}
                    type="button"
                    role="tab"
                    aria-selected={i === activeIdx}
                    className={cx('dot', {active: i === activeIdx})}
                    onClick={() => setActiveIdx(i)}
                    aria-label={`Chọn kiểm tra ${i + 1}`}
                  />
                ))}
              </div>
              <button type="button" className={cx('switchBtn')} onClick={goNext} aria-label="Sau">
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
    </section>
  );
}

export default HeroSection;
