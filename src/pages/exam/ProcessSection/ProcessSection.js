import React from 'react';
import { FaSearch, FaLaptopCode, FaChartLine } from 'react-icons/fa';
import classNames from 'classnames/bind';
import styles from './ProcessSection.module.scss';

const cx = classNames.bind(styles);

const ProcessSection = () => {
    return (
        <section className={cx('section', 'process-section')}>
            <div className="container">
                <div className="text-center mb-5">
                    <h2 className={cx('section-title')}>Quy trình ôn luyện</h2>
                    <p className="text-muted">Đơn giản hóa hành trình chinh phục điểm số</p>
                </div>
                <div className="row g-4">
                    <div className="col-md-4">
                        <div className={cx('process-card')}>
                            <div className={cx('icon-box', 'blue')}><FaSearch /></div>
                            <h3>1. Chọn đề thi</h3>
                            <p>Tìm kiếm đề thi phù hợp với trình độ và mục tiêu từ kho dữ liệu.</p>
                        </div>
                    </div>
                    <div className="col-md-4">
                        <div className={cx('process-card')}>
                            <div className={cx('icon-box', 'orange')}><FaLaptopCode /></div>
                            <h3>2. Làm bài thi</h3>
                            <p>Giao diện thi thực tế, bấm giờ và chấm điểm tự động ngay lập tức.</p>
                        </div>
                    </div>
                    <div className="col-md-4">
                        <div className={cx('process-card')}>
                            <div className={cx('icon-box', 'green')}><FaChartLine /></div>
                            <h3>3. Xem phân tích</h3>
                            <p>Xem lại lỗi sai và lời giải chi tiết để rút kinh nghiệm cho lần sau.</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default ProcessSection;
