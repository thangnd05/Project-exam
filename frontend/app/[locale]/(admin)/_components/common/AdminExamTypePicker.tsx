'use client';

import classNames from 'classnames/bind';
import {useTranslations} from 'next-intl';

import ButtonPrime from '@/app/components/Button/ButtonPrime';
import {VENDORS} from '@/app/[locale]/(public)/_lib/certificationMeta';
import {
  useExamTypeGroups,
  type ExamTypeSource,
} from '@/app/[locale]/(admin)/_hooks/useExamTypeGroups';
import styles from './examTypePicker.module.scss';

const cx = classNames.bind(styles);

type AdminExamTypePickerProps = {
  value: string;
  onChange: (examTypeId: string) => void;
  /** Cho bấm lại viên đang chọn để bỏ lọc, trả về `clearValue` (xem tất cả kỳ thi). */
  clearable?: boolean;
  clearValue?: string;
  source?: ExamTypeSource;
};

// Bộ lọc kỳ thi dạng viên, mỗi hãng một hàng như bộ lọc ở Kho đề thi ngoài web.
function AdminExamTypePicker({
  value,
  onChange,
  clearable = false,
  clearValue = '',
  source,
}: AdminExamTypePickerProps) {
  const t = useTranslations('AdminCommon.examPicker');
  const {groups} = useExamTypeGroups(source);

  if (groups.length === 0) return null;

  const select = (id: string) => {
    if (id !== value) onChange(id);
    else if (clearable) onChange(clearValue);
  };

  return (
    <div className={cx('picker')} role="group" aria-label={t('ariaLabel')}>
      {groups.map((group) => (
        <div key={group.vendor} className={cx('row')}>
          <span className={cx('vendor')}>
            <span className={cx('dot', `dot-${group.vendor}`)} aria-hidden="true" />
            {group.vendor === 'other'
              ? t('otherVendor')
              : VENDORS.find((v) => v.id === group.vendor)?.label}
          </span>
          <div className={cx('pills')}>
            {group.exams.map((exam) => (
              <ButtonPrime
                key={exam.id}
                variant={exam.id === value ? 'ink' : 'outline'}
                size="sm"
                title={exam.id === value && clearable ? t('clearHint', {name: exam.name}) : exam.name}
                aria-pressed={exam.id === value}
                className={cx('pill')}
                onClick={() => select(exam.id)}
              >
                {exam.label}
              </ButtonPrime>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default AdminExamTypePicker;
