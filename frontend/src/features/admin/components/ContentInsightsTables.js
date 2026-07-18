import classNames from 'classnames/bind';
import { motion } from 'framer-motion';

import styles from './ContentInsightsTables.module.scss';

const cx = classNames.bind(styles);

/** Thanh tỉ lệ nhỏ trong ô bảng — tông xanh dương đồng nhất (minimalism, không traffic-light). */
const RateBar = ({ value }) => (
    <div className={cx('rateCell')}>
        <div className={cx('rateTrack')}>
            <div
                className={cx('rateFill')}
                style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
            />
        </div>
        <span className={cx('rateValue')}>{value}%</span>
    </div>
);

const EmptyRow = ({ colSpan, message }) => (
    <tr>
        <td colSpan={colSpan} className={cx('empty')}>{message}</td>
    </tr>
);

/** Bảng bài thi hoạt động nhiều nhất: lượt làm, tỉ lệ hoàn thành, điểm TB. */
export const TopTestsTable = ({ data = [] }) => (
    <div className={cx('tableWrap')}>
        <table className={cx('table')}>
            <thead>
                <tr>
                    <th className={cx('rank')}>#</th>
                    <th>Bài thi</th>
                    <th className={cx('num')}>Lượt làm</th>
                    <th className={cx('rateCol')}>Tỉ lệ hoàn thành</th>
                </tr>
            </thead>
            <tbody>
                {data.length === 0 ? (
                    <EmptyRow colSpan={4} message="Chưa có lượt làm bài nào." />
                ) : (
                    data.map((t, i) => (
                        <motion.tr
                            key={t.testId}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.03 }}
                        >
                            <td className={cx('rank')}>{i + 1}</td>
                            <td className={cx('title')} title={t.title}>{t.title}</td>
                            <td className={cx('num')}>{t.attempts}</td>
                            <td className={cx('rateCol')}>
                                <RateBar value={t.completionRate} />
                            </td>
                        </motion.tr>
                    ))
                )}
            </tbody>
        </table>
    </div>
);
