'use client';

import classNames from 'classnames/bind';
import type { LucideIcon } from 'lucide-react';
import ButtonPrime from '@/app/components/Button/ButtonPrime';
import styles from './PageHeader.module.scss';

const cx = classNames.bind(styles);

type PageHeaderViewToggleOption = {
  key: string;
  title?: string;
  icon?: LucideIcon;
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

        const active = activeKey === option.key;

        return (
          <ButtonPrime
            key={option.key}
            variant={active ? 'outline' : 'ghost'}
            size="icon"
            className={cx('toggleBtn')}
            onClick={() => onChange(option.key)}
            title={option.title}
            aria-pressed={active}
          >
            {Icon ? <Icon size="1em" /> : null}
          </ButtonPrime>
        );
      })}
    </div>
  );
}

export default PageHeaderViewToggle;
