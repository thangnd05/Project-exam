'use client';

import classNames from 'classnames/bind';
import { useTranslations } from 'next-intl';
import ButtonPrime from '@/app/components/Button/ButtonPrime';
import styles from '@/app/features/tests/CreateTestModal.module.scss';

const cx = classNames.bind(styles);

export const PAGE_SIZE = 20;

export const pageCountOf = (total: number, pageSize = PAGE_SIZE) => Math.max(1, Math.ceil(total / pageSize));

type PagerProps = {
  page: number;
  pageCount: number;
  onChange: (page: number) => void;
};

/** Phân trang danh sách câu hỏi: vẽ cả nghìn câu một lúc làm trang giật. */
const Pager = ({ page, pageCount, onChange }: PagerProps) => {
  const t = useTranslations('TestCreator');
  if (pageCount <= 1) return null;
  return (
    <div className={cx('pager')}>
      <ButtonPrime size="sm" variant="soft" disabled={page <= 0} onClick={() => onChange(0)}>
        {t('pager.first')}
      </ButtonPrime>
      <ButtonPrime size="sm" variant="soft" disabled={page <= 0} onClick={() => onChange(page - 1)}>
        {t('pager.prev')}
      </ButtonPrime>
      <span className={cx('pagerInfo')}>
        {t('pager.page')}
        <select value={page} onChange={(e) => onChange(Number(e.target.value))} aria-label={t('pager.selectPage')}>
          {Array.from({ length: pageCount }, (_, i) => (
            <option key={i} value={i}>{i + 1}</option>
          ))}
        </select>
        / {pageCount}
      </span>
      <ButtonPrime size="sm" variant="soft" disabled={page >= pageCount - 1} onClick={() => onChange(page + 1)}>
        {t('pager.next')}
      </ButtonPrime>
      <ButtonPrime size="sm" variant="soft" disabled={page >= pageCount - 1} onClick={() => onChange(pageCount - 1)}>
        {t('pager.last')}
      </ButtonPrime>
    </div>
  );
};

export default Pager;
