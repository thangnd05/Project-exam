import React from 'react';
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
    title: '1. Chọn đề thi',
    description:
      'Tìm kiếm đề thi phù hợp với trình độ và mục tiêu từ kho dữ liệu.',
  },
  {
    id: 2,
    icon: FaLaptopCode,
    iconColor: 'orange',
    title: '2. Làm bài thi',
    description:
      'Giao diện thi thực tế, bấm giờ và chấm điểm tự động ngay lập tức.',
  },
  {
    id: 3,
    icon: FaChartLine,
    iconColor: 'green',
    title: '3. Xem phân tích',
    description:
      'Xem lại lỗi sai và lời giải chi tiết để rút kinh nghiệm cho lần sau.',
  },
];

const ProcessSection = () => {
  return (
    <section className={cx('section', 'process-section')}>
      <div className="container">
        <div className="text-center mb-5">
          <h2 className={cx('section-title')}>Quy trình ôn luyện</h2>
          <p className="text-muted">
            Đơn giản hóa hành trình chinh phục điểm số
          </p>
        </div>
        <div className={cx('processGrid')}>
          {processSteps.map((step, index) => {
            const StepIcon = step.icon;
            const hasTransition = index < processSteps.length - 1;

            return (
              <div key={step.id} className={cx('processItem')}>
                <div className={cx('process-card')}>
                  <div className={cx('icon-box', step.iconColor)}>
                    <StepIcon />
                  </div>
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                </div>
                {hasTransition && (
                  <span className={cx('stepTransition')} aria-hidden="true">
                    <FaArrowRight />
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ProcessSection;
