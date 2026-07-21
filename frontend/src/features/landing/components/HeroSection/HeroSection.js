import {useEffect, useMemo, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import classNames from 'classnames/bind';
import {motion} from 'framer-motion';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

import styles from './HeroSection.module.scss';
import {name} from '~/shared/assets/images';
import {calculateAllowedTime} from '~/shared/utils/testStatusHelper';
import {useQuickChallengeTests} from './hooks/useQuickChallengeTests';
import ButtonPrime from '~/shared/ui/Button/ButtonPrime';
import { brandColors } from '~/shared/styles/brandColors';

const cx = classNames.bind(styles);

const MAX_BARS_SHOWN = 4;

const COLOR_DARK = brandColors.primary;
const COLOR_LIGHT = brandColors.brand300;
const partColor = (idx) => (idx % 2 === 0 ? COLOR_DARK : COLOR_LIGHT);

const containerVariants = {
  hidden: {opacity: 0},
  visible: {
    opacity: 1,
    transition: {staggerChildren: 0.12, delayChildren: 0.1},
  },
};

const itemVariants = {
  hidden: {opacity: 0, y: 24},
  visible: {
    opacity: 1,
    y: 0,
    transition: {duration: 0.7, ease: [0.22, 1, 0.36, 1]},
  },
};

const imageVariants = {
  hidden: {opacity: 0, scale: 0.95, y: 20},
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.2},
  },
};

const buildRingGradient = (parts, total) => {
  if (!total || !parts.length) return '#e2e8f0';
  let acc = 0;
  const stops = parts.map((part, idx) => {
    const start = (acc / total) * 100;
    acc += part.numQuestions;
    const end = (acc / total) * 100;
    return `${partColor(idx)} ${start}% ${end}%`;
  });
  return `conic-gradient(${stops.join(', ')})`;
};

const PrevArrow = ({onClick}) => (
  <button
    type="button"
    className={cx('nav-arrow', 'prev')}
    onClick={onClick}
    aria-label="Loại trước"
  >
    ‹
  </button>
);

const NextArrow = ({onClick}) => (
  <button
    type="button"
    className={cx('nav-arrow', 'next')}
    onClick={onClick}
    aria-label="Loại sau"
  >
    ›
  </button>
);

function HeroSection() {
  const navigate = useNavigate();
  const {quickTests, isLoading: loading} = useQuickChallengeTests();

  const [isDesktop, setIsDesktop] = useState(
    typeof window === 'undefined' ? true : window.innerWidth > 992,
  );

  useEffect(() => {
    const onResize = () => setIsDesktop(window.innerWidth > 992);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

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

  const handleScrollToExam = () => {
    const element = document.getElementById('explore-orb');
    if (element) {
      element.scrollIntoView({behavior: 'smooth'});
    }
  };

  const handleStartQuick = (test) => {
    navigate(`/tests/${test.testId}/start`, {
      state: {allowedTime: calculateAllowedTime(test)},
    });
  };

  const hasQuick = !loading && cards.length > 0;

  const multi = cards.length > 1;
  const peek = multi && isDesktop;
  const sliderSettings = {
    dots: true,
    arrows: peek,
    infinite: multi,
    speed: 400,
    slidesToShow: 1,
    slidesToScroll: 1,

    variableWidth: peek,
    prevArrow: <PrevArrow />,
    nextArrow: <NextArrow />,
  };

  return (
    <section className={cx('hero')}>
      <div className={classNames('container', cx('hero-grid'))}>
      <motion.div
        className={cx('content')}
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <motion.p className={cx('brandLead')} variants={itemVariants}>
          {name}
        </motion.p>
        <motion.h1 className={cx('welcome')} variants={itemVariants}>
          Luyện đề thông minh, lộ trình{' '}
          <span className={cx('accent')}>cá nhân hóa</span>
        </motion.h1>
        <motion.p className={cx('desc')} variants={itemVariants}>
          Bắt đầu Quick Challenge để chẩn đoán năng lực và nhận lộ trình ôn tối ưu.
        </motion.p>
        <motion.div className={cx('actions')} variants={itemVariants}>
          <ButtonPrime className={cx('btn-primary')} onClick={handleScrollToExam}>
            Bắt đầu luyện
          </ButtonPrime>
        </motion.div>
      </motion.div>

      <motion.div
        className={cx('image-wrapper')}
        initial="hidden"
        animate="visible"
        variants={imageVariants}
      >
        {loading ? (
          <div className={cx('type-card', 'is-skeleton')} aria-hidden>
            <div className={cx('skeleton-line', 'w-40')} />
            <div className={cx('skeleton-ring')} />
            <div className={cx('skeleton-line')} />
            <div className={cx('skeleton-line', 'w-60')} />
            <div className={cx('skeleton-btn')} />
          </div>
        ) : hasQuick ? (
          <div className={cx('quick-carousel', {peek})}>
            <Slider key={peek ? 'peek' : 'plain'} {...sliderSettings}>
              {cards.map((test) => {
                const parts = test.parts || [];
                const total = test.totalQuestions || 0;
                const shown = parts.slice(0, MAX_BARS_SHOWN);
                const restCount = parts.length - shown.length;
                return (
                  <div key={test.testId} className={cx('slide')}>
                    <div className={cx('type-card')}>
                      <div className={cx('card-head')}>
                        <span className={cx('mock-badge')}>Quick Challenge</span>
                        <span className={cx('type-name')} title={test.examTypeName}>
                          {test.examTypeName}
                        </span>
                      </div>

                      <div className={cx('card-body')}>
                        <div className={cx('gauge')}>
                          <div
                            className={cx('gauge-ring')}
                            style={{background: buildRingGradient(parts, total)}}
                          >
                            <div className={cx('gauge-hole')}>
                              <span className={cx('gauge-num')}>{total}</span>
                              <span className={cx('gauge-label')}>câu hỏi</span>
                            </div>
                          </div>
                        </div>

                        {shown.length > 0 ? (
                          <ul className={cx('bar-list')}>
                            {shown.map((part, idx) => {
                              const pct = total
                                ? Math.round((part.numQuestions / total) * 100)
                                : 0;
                              const color = partColor(idx);
                              return (
                                <li key={idx} className={cx('bar-item')}>
                                  <div className={cx('bar-top')}>
                                    <span className={cx('bar-name')} title={part.name}>
                                      {part.name}
                                    </span>
                                    <span className={cx('bar-count')}>
                                      {part.numQuestions}
                                    </span>
                                  </div>
                                  <div className={cx('bar-track')}>
                                    <div
                                      className={cx('bar-fill')}
                                      style={{width: `${pct}%`, background: color}}
                                    />
                                  </div>
                                </li>
                              );
                            })}
                            {restCount > 0 && (
                              <li className={cx('bar-more')}>
                                + {restCount} mục khác
                              </li>
                            )}
                          </ul>
                        ) : (
                          <p className={cx('no-part')}>Bài thi nhanh sẵn sàng</p>
                        )}
                      </div>

                      <ButtonPrime
                        className={cx('btn-cta')}
                        onClick={() => handleStartQuick(test)}
                      >
                        Bắt đầu Quick Challenge
                      </ButtonPrime>
                    </div>
                  </div>
                );
              })}
            </Slider>
          </div>
        ) : (
          <div className={cx('mockup-screen')}>
            <img
              src="https://img.freepik.com/free-vector/online-certification-illustration-concept_23-2148575640.jpg"
              alt="WinDe Education Illustration"
            />
          </div>
        )}
      </motion.div>
      </div>
    </section>
  );
}

export default HeroSection;
