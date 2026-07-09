import React from 'react';
import classNames from 'classnames/bind';
import styles from '../CreateTestModal.module.scss';
import { CREATOR_TYPES } from '~/shared/hooks/useCreateTest';

const cx = classNames.bind(styles);

const CreatorTabs = ({ activeCreatorType, setCreatorType }) => {
    return (
        <div className={cx('creatorTypeTabs')}>
            <button
                type="button"
                className={cx('creatorTypeTab', { active: activeCreatorType === CREATOR_TYPES.TEST })}
                onClick={() => setCreatorType(CREATOR_TYPES.TEST)}
            >
                Tạo đề thi
            </button>
            <button
                type="button"
                className={cx('creatorTypeTab', { active: activeCreatorType === CREATOR_TYPES.BANK })}
                onClick={() => setCreatorType(CREATOR_TYPES.BANK)}
            >
                Tạo đề từ kho
            </button>
            <button
                type="button"
                className={cx('creatorTypeTab', { active: activeCreatorType === CREATOR_TYPES.BULK })}
                onClick={() => setCreatorType(CREATOR_TYPES.BULK)}
            >
                Tạo câu hỏi số lượng lớn vào kho đề
            </button>
            <button
                type="button"
                className={cx('creatorTypeTab', { active: activeCreatorType === CREATOR_TYPES.PASSAGE })}
                onClick={() => setCreatorType(CREATOR_TYPES.PASSAGE)}
            >
                Tạo nhóm câu hỏi theo đoạn vào kho đề
            </button>
        </div>
    );
};

export default CreatorTabs;
