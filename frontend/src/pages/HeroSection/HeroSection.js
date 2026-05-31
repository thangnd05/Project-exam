import {useEffect, useMemo, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import classNames from 'classnames/bind';
import {motion} from 'framer-motion';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

import styles from './HeroSection.module.scss';
import {name} from '~/assets/images';
import {getQuickChallengeTests} from '~/api/testApi';
import {calculateAllowedTime} from '~/utils/testStatusHelper';

const cx = classNames.bind(styles);

const MAX_BARS_SHOWN = 4;

// Màu xen kẽ theo cùng tông xanh: mục lẻ (Part 1,3,5...) đậm, mục chẵn (Part 2,4,6...) nhạt.
// idx 0-based -> idx chẵn = mục lẻ = đậm; idx lẻ = mục chẵn = nhạt.
const COLOR_DARK = '#0061f2';
const COLOR_LIGHT = '#7fb1ff';
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

// conic-gradient cho donut: mỗi part 1 cung tỉ lệ theo số câu
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
  const [quickTests, setQuickTests] = useState([]);
  const [loading, setLoading] = useState(true);
  // Peek (card sau ló phải) chỉ ở desktop; mobile -> 1 card full-width
  const [isDesktop, setIsDesktop] = useState(
    typeof window === 'undefined' ? true : window.innerWidth > 992,
  );

  useEffect(() => {
    const onResize = () => setIsDesktop(window.innerWidth > 992);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    let mounted = true;
    getQuickChallengeTests()
      .then((data) => {
        if (mounted) setQuickTests(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (mounted) setQuickTests([]);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  // 1 card / 1 examType: gom theo examType, mỗi loại lấy 1 bài (bài đầu tiên)
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
    const element = document.getElementById('exam-types');
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
  const peek = multi && isDesktop; // desktop nhiều card -> ló card sau; mobile -> 1 card full
  const sliderSettings = {
    dots: true,
    arrows: peek,
    infinite: multi,
    speed: 400,
    slidesToShow: 1,
    slidesToScroll: 1,
    // variableWidth -> card căn trái, card kế tiếp ló ra bên phải (chỉ desktop)
    variableWidth: peek,
    prevArrow: <PrevArrow />,
    nextArrow: <NextArrow />,
  };

  return (
    <section className={cx('hero')}>
      <motion.div
        className={cx('content')}
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <motion.span className={cx('badge')} variants={itemVariants}>
          ⚡ Chẩn đoán nhanh năng lực
        </motion.span>
        <motion.h1 className={cx('welcome')} variants={itemVariants}>
          Chào mừng đến với {name}
        </motion.h1>
        <motion.p className={cx('desc')} variants={itemVariants}>
          <strong>{name}</strong> – nền tảng luyện đề giúp cá nhân hóa lộ trình học tập của bạn. 
          Hãy bắt đầu bằng một bài kiểm tra nhanh bên cạnh để hệ thống chẩn đoán năng lực, từ đó xác định 
          mục tiêu và xây dựng lộ trình ôn luyện tối ưu nhất!
        </motion.p>
        <motion.div className={cx('actions')} variants={itemVariants}>
          <button className={cx('btn-primary')} onClick={handleScrollToExam}>
            Bắt đầu ngay
          </button>
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
                        <span className={cx('type-name')} title={test.examTypeName}>
                          {test.examTypeName}
                        </span>
                        <span className={cx('mock-badge')}>Quick Challenge</span>
                      </div>

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
                                  <span
                                    className={cx('bar-count')}
                                    style={{color}}
                                  >
                                    {part.numQuestions} câu
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

                      <button
                        className={cx('btn-cta')}
                        onClick={() => handleStartQuick(test)}
                      >
                        BẮT ĐẦU QUICK CHALLENGE →
                      </button>
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
    </section>
  );
}

export default HeroSection;
