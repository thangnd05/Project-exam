import React from 'react';
import {motion} from 'framer-motion';
import classNames from 'classnames/bind';
import styles from './ProcessSection.module.scss';

const cx = classNames.bind(styles);

const processSteps = [
  {
    id: 1,
    title: 'Làm bài thử',
    description:
      'Trải nghiệm giao diện thi thực tế với hệ thống bấm giờ và chấm điểm tự động ngay khi nộp bài.',
  },
  {
    id: 2,
    title: 'Nhận chẩn đoán',
    description:
      'Phân tích chi tiết kết quả, chỉ ra điểm mạnh, điểm yếu và mức độ đạt mục tiêu của bạn.',
  },
  {
    id: 3,
    title: 'Luyện theo kế hoạch',
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

const ProcessSection = () => {
  return (
    <section className={cx('section', 'process-section')}>
      <div className="container">
        <motion.div
          className={cx('sectionHead')}
          initial="hidden"
          whileInView="visible"
          viewport={{once: true, amount: 0.5}}
          variants={headerVariants}
        >
          <h2 className={cx('section-title')}>Quy trình ôn luyện</h2>
          <p className={cx('section-subtitle')}>
            Đơn giản hóa hành trình chinh phục điểm số
          </p>
        </motion.div>
        <div className={cx('processGrid')}>
          {processSteps.map((step, index) => (
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
                <span className={cx('step-number')}>
                  {String(step.id).padStart(2, '0')}
                </span>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProcessSection;
