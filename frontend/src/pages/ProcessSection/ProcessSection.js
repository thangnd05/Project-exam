import React from 'react';
import {motion} from 'framer-motion';
import {
  FaArrowRight,
  FaChartLine,
  FaLaptopCode,
  FaSearch,
} from 'react-icons/fa';
import classNames from 'classnames/bind';
import styles from './ProcessSection.module.scss';

const cx = classNames.bind(styles);

const processSteps = [
  {
    id: 1,
    icon: FaSearch,
    iconColor: 'blue',
    title: '1. Làm bài thử',
    description:
      'Trải nghiệm giao diện thi thực tế với hệ thống bấm giờ và chấm điểm tự động ngay khi nộp bài.',
  },
  {
    id: 2,
    icon: FaLaptopCode,
    iconColor: 'orange',
    title: '2. Nhận chẩn đoán',
    description:
      'Phân tích chi tiết kết quả, chỉ ra điểm mạnh, điểm yếu và mức độ đạt mục tiêu của bạn.',
  },
  {
    id: 3,
    icon: FaChartLine,
    iconColor: 'green',
    title: '3. Luyện theo kế hoạch',
    description:
      'Nhận lộ trình ôn luyện tối ưu, tập trung sửa các lỗi sai thường gặp để cải thiện điểm số nhanh chóng.',
  },
];

const headerVariants = {
  hidden: {opacity: 0, y: 24},
  visible: {
    opacity: 1,
    y: 0,
    transition: {duration: 0.7, ease: [0.22, 1, 0.36, 1]},
  },
};

const cardVariants = {
  hidden: {opacity: 0, y: 30},
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      delay: i * 0.15,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
};

const arrowVariants = {
  hidden: {opacity: 0, x: -8},
  visible: (i) => ({
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.5,
      delay: i * 0.15 + 0.4,
    },
  }),
};

const ProcessSection = () => {
  return (
    <section className={cx('section', 'process-section')}>
      <div className="container">
        <motion.div
          className="text-center mb-5"
          initial="hidden"
          whileInView="visible"
          viewport={{once: true, amount: 0.5}}
          variants={headerVariants}
        >
          <h2 className={cx('section-title')}>Quy trình ôn luyện</h2>
          <p className="text-muted">
            Đơn giản hóa hành trình chinh phục điểm số
          </p>
        </motion.div>
        <div className={cx('processGrid')}>
          {processSteps.map((step, index) => {
            const StepIcon = step.icon;
            const hasTransition = index < processSteps.length - 1;

            return (
              <motion.div
                key={step.id}
                className={cx('processItem')}
                custom={index}
                initial="hidden"
                whileInView="visible"
                viewport={{once: true, amount: 0.3}}
                variants={cardVariants}
              >
                <div className={cx('process-card')}>
                  <div className={cx('icon-box', step.iconColor)}>
                    <StepIcon />
                  </div>
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                </div>
                {hasTransition && (
                  <motion.span
                    className={cx('stepTransition')}
                    aria-hidden="true"
                    custom={index}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{once: true, amount: 0.3}}
                    variants={arrowVariants}
                  >
                    <FaArrowRight />
                  </motion.span>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ProcessSection;
