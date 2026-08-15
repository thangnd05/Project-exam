'use client';

import PropTypes from 'prop-types';
import classNames from 'classnames/bind';
import styles from './PageHeader.module.scss';

const cx = classNames.bind(styles);

function PageHeaderViewToggle({options, activeKey, onChange}) {
  return (
    <div className={cx('viewToggle')}>
      {options.map((option) => {
        const Icon = option.icon;

        return (
          <button
            key={option.key}
            type="button"
            className={cx('toggleBtn', {active: activeKey === option.key})}
            onClick={() => onChange(option.key)}
            title={option.title}
          >
            {Icon ? <Icon /> : null}
          </button>
        );
      })}
    </div>
  );
}

PageHeaderViewToggle.propTypes = {
  options: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      title: PropTypes.string,
      icon: PropTypes.elementType,
    }),
  ).isRequired,
  activeKey: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
};

export default PageHeaderViewToggle;
