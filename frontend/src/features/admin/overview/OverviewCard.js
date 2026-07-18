import classNames from 'classnames/bind';
import { motion } from 'framer-motion';

import styles from './OverviewCard.module.scss';

const cx = classNames.bind(styles);

/**
 * Card số liệu tổng quan dùng chung cho Dashboard & Thống kê — chỉ chữ, không icon.
 * label (in hoa nhỏ) ở trên, value lớn ở dưới; period là badge góc phải, sub là dòng phụ — đều tuỳ chọn.
 */
const OverviewCard = ({ label, value, period, sub, delay = 0 }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.4 }}
        className={cx('overviewCard')}
    >
        <div className={cx('top')}>
            <span className={cx('label')}>{label}</span>
            {period && <span className={cx('period')}>{period}</span>}
        </div>
        <span className={cx('value')}>{value}</span>
        {sub && <span className={cx('sub')}>{sub}</span>}
    </motion.div>
);

export default OverviewCard;
