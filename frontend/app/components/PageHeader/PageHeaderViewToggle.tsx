'use client';

import classNames from 'classnames/bind';
import styles from './PageHeader.module.scss';

const cx = classNames.bind(styles);

type PageHeaderViewToggleOption = {
  key: string;
  title?: string;
  icon?: React.ElementType;
};

type PageHeaderViewToggleProps = {
  options: PageHeaderViewToggleOption[];
  activeKey: string;
  onChange: (key: string) => void;
};

function PageHeaderViewToggle({options, activeKey, onChange}: PageHeaderViewToggleProps) {
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

export default PageHeaderViewToggle;
