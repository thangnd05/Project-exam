import React from 'react';
import {
    FaDatabase, FaLayerGroup, FaCheckCircle
} from 'react-icons/fa';
import classNames from 'classnames/bind';
import styles from './HomeContent.module.scss';

const cx = classNames.bind(styles);

const HomeContent = () => {
    return (
        <div className={cx('home-content-wrapper')}>
            {/* --- PHẦN 2: THỐNG KÊ --- */}
            <section className={cx('section', 'stats-section')}>
                <div className="container">
                    <div className="row text-center">
                        <div className="col-md-4 mb-4 mb-md-0">
                            <div className={cx('stat-item')}>
                                <FaDatabase className={cx('stat-icon')} />
                                <h3 className="display-4 fw-bold">500+</h3>
                                <p>Câu hỏi trắc nghiệm</p>
                            </div>
                        </div>
                        <div className="col-md-4 mb-4 mb-md-0">
                            <div className={cx('stat-item')}>
                                <FaLayerGroup className={cx('stat-icon')} />
                                <h3 className="display-4 fw-bold">50+</h3>
                                <p>Bộ đề hoàn chỉnh</p>
                            </div>
                        </div>
                        <div className="col-md-4">
                            <div className={cx('stat-item')}>
                                <FaCheckCircle className={cx('stat-icon')} />
                                <h3 className="display-4 fw-bold">100%</h3>
                                <p>Có giải thích chi tiết</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- PHẦN 3: ĐÁNH GIÁ (COMPONENTS TÁCH RIÊNG) --- */}
        </div>
    );
};

export default HomeContent;