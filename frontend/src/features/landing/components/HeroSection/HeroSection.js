import {useCallback, useEffect, useMemo, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import classNames from 'classnames/bind';
import {AnimatePresence, motion} from 'framer-motion';

import styles from './HeroSection.module.scss';
import {name} from '~/shared/assets/images';
import {calculateAllowedTime} from '~/shared/utils/testStatusHelper';
import {useQuickChallengeTests} from './hooks/useQuickChallengeTests';

const cx = classNames.bind(styles);

const FALLBACK_ROWS = [
  {name: 'Networking & VPC', pct: 72},
  {name: 'IAM & Security', pct: 41},
  {name: 'Storage (S3, EBS)', pct: 80},
  {name: 'Compute (EC2)', pct: 65},
];

const SCORE_PATTERN = [78, 41, 84, 62, 55];

function buildDiagnosisRows(parts) {
  const list = (parts || []).slice(0, 5);
  const base =
    list.length > 0
      ? list.map((part, i) => ({
          name: part.name || `Chủ đề ${i + 1}`,
          pct: SCORE_PATTERN[i % SCORE_PATTERN.length],
        }))
      : FALLBACK_ROWS;

  const minPct = Math.min(...base.map((r) => r.pct));
  let marked = false;
  return base.map((row) => {
    const weak = !marked && row.pct === minPct;
    if (weak) marked = true;
    return {...row, weak};
  });
}

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
  const diagnosisRows = useMemo(() => buildDiagnosisRows(parts), [parts]);

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
            <span className={cx('headlineLead')}>5 phút.</span>
            <br />
            Biết chính xác
            <br />
            mình <span className={cx('accent')}>hổng chỗ nào.</span>
          </h1>
          <p className={cx('lede')}>
            Không cần cày hết ngân hàng đề — {name} chỉ ra phần bạn yếu và lộ trình
            ôn ngắn nhất.
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
          initial={{opacity: 0, scale: 0.96}}
          animate={{opacity: 1, scale: 1}}
          transition={{duration: 1.1, delay: 0.15, ease: [0.22, 1, 0.36, 1]}}
        >
          <div className={cx('diagnosisCard')}>
            <AnimatePresence mode="wait">
              <motion.div
                key={active?.testId ?? 'empty'}
                initial={{opacity: 0, y: 10}}
                animate={{opacity: 1, y: 0}}
                exit={{opacity: 0, y: -8}}
                transition={{duration: 0.3}}
              >
                <div className={cx('diagHead')}>
                  <span className={cx('diagBadge')}>Kết quả chẩn đoán</span>
                  {loading ? (
                    <p className={cx('diagTitle')}>Đang tải…</p>
                  ) : (
                    <>
                      <p className={cx('diagTitle')} title={active?.examTypeName}>
                        {active?.examTypeName || 'Kiểm tra nhanh'}
                      </p>
                      {total > 0 && (
                        <p className={cx('diagMeta')}>{total} câu · mẫu kết quả</p>
                      )}
                    </>
                  )}
                </div>

                <ul className={cx('skillList')}>
                  {diagnosisRows.map((row) => (
                    <li
                      key={row.name}
                      className={cx('skillRow', {weak: row.weak})}
                    >
                      <div className={cx('skillTop')}>
                        <span className={cx('skillName')} title={row.name}>
                          {row.name}
                        </span>
                        <strong className={cx('skillPct')}>{row.pct}%</strong>
                      </div>
                      <div className={cx('skillTrack')}>
                        <motion.div
                          className={cx('skillFill', {weak: row.weak})}
                          initial={{width: 0}}
                          animate={{width: `${row.pct}%`}}
                          transition={{duration: 0.7, ease: [0.22, 1, 0.36, 1]}}
                        />
                      </div>
                      {row.weak && (
                        <span className={cx('weakTag')}>Ưu tiên ôn</span>
                      )}
                    </li>
                  ))}
                </ul>
              </motion.div>
            </AnimatePresence>
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
