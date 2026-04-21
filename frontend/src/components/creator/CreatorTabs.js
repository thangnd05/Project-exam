import React from 'react';
import { IoRocketOutline, IoMusicalNotesOutline, IoLayersOutline, IoLibraryOutline } from 'react-icons/io5';
import classNames from 'classnames/bind';
import styles from '../modals/CreateTestModal.module.scss';
import { CREATOR_TYPES } from '~/hook/useCreateTest';

const cx = classNames.bind(styles);

const CreatorTabs = ({ activeCreatorType, setCreatorType }) => {
    return (
        <div className={cx('creatorTypeTabs')}>
            <button
                type="button"
                className={cx('creatorTypeTab', { active: activeCreatorType === CREATOR_TYPES.TEST })}
                onClick={() => setCreatorType(CREATOR_TYPES.TEST)}
            >
                <IoRocketOutline size={20} /> Tạo đề thi
            </button>
            <button
                type="button"
                className={cx('creatorTypeTab', { active: activeCreatorType === CREATOR_TYPES.BANK })}
                onClick={() => setCreatorType(CREATOR_TYPES.BANK)}
            >
                <IoLibraryOutline size={20} /> Tạo đề từ kho
            </button>
            <button
                type="button"
                className={cx('creatorTypeTab', { active: activeCreatorType === CREATOR_TYPES.BULK })}
                onClick={() => setCreatorType(CREATOR_TYPES.BULK)}
            >
                <IoMusicalNotesOutline size={20} /> Tạo câu hỏi số lượng lớn vào kho đề
            </button>
            <button
                type="button"
                className={cx('creatorTypeTab', { active: activeCreatorType === CREATOR_TYPES.PASSAGE })}
                onClick={() => setCreatorType(CREATOR_TYPES.PASSAGE)}
            >
                <IoLayersOutline size={20} /> Tạo nhóm câu hỏi theo đoạn vào kho đề
            </button>
        </div>
    );
};

export default CreatorTabs;
