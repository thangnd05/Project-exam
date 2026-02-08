import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames/bind';
import styles from './PageHeader.module.scss';

const cx = classNames.bind(styles);

const PageHeader = ({
    title,
    label,
    badgeLabel,
    onAction,
    actionText,
    actionIcon: Icon,
    className
}) => {
    return (
        <div className={cx('headerHero', className)}>
            <div className={cx('heroContent')}>
                {label && <span className={cx('label')}>{label}</span>}
                <h1>{title}</h1>
                {badgeLabel && (
                    <div className={cx('badge')}>
                        {badgeLabel}
                    </div>
                )}
            </div>

            {onAction && actionText && (
                <button
                    className={cx('actionBtn')}
                    onClick={onAction}
                >
                    {Icon && <Icon size={24} />}
                    {actionText}
                </button>
            )}
        </div>
    );
};

PageHeader.propTypes = {
    title: PropTypes.string.isRequired,
    label: PropTypes.string,
    badgeLabel: PropTypes.node,
    onAction: PropTypes.func,
    actionText: PropTypes.string,
    actionIcon: PropTypes.elementType,
    className: PropTypes.string,
};

export default PageHeader;
