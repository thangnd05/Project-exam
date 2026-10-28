'use client';

import { useMemo } from 'react';
import classNames from 'classnames/bind';
import { useTranslations } from 'next-intl';
import ButtonPrime from '@/app/components/Button/ButtonPrime';
import { parseCode, parseVendor } from '@/app/[locale]/(public)/_lib/certificationMeta';
import type { ExamTypeResponse } from '@/app/types/exam-type';
import styles from './ExamPillPicker.module.scss';

const cx = classNames.bind(styles);

type ExamPillPickerProps = {
  examTypes: readonly ExamTypeResponse[];
  value: string;
  onChange: (examTypeId: string) => void;
  label?: string;
  /** Có thì thêm viên "Tất cả" (giá trị rỗng) ở đầu. */
  allLabel?: string;
  /** Số đếm cạnh mỗi kỳ thi, như "SAA-C03 (3)". */
  counts?: Record<string, number>;
  className?: string;
};

// Chọn kỳ thi dạng viên thuốc như bộ lọc ở Kho tài liệu / Kho đề thi: chấm màu hãng + mã kỳ thi.
function ExamPillPicker({
  examTypes,
  value,
  onChange,
  label,
  allLabel,
  counts,
  className,
}: ExamPillPickerProps) {
  const t = useTranslations('MyTarget');
  const pickerLabel = label ?? t('examPicker.label');
  const pills = useMemo(
    () =>
      examTypes.map((exam) => {
        const name = exam.name?.trim() ?? '';
        const code = parseCode(name);
        return {
          id: exam.examTypeId,
          name,
          label: code || name,
          vendor: parseVendor(exam, code) ?? 'other',
        };
      }),
    [examTypes],
  );

  if (pills.length === 0) return null;

  const countOf = (id: string) => (counts && counts[id] != null ? ` (${counts[id]})` : '');

  return (
    <div className={cx('row', className)} role="group" aria-label={t('examPicker.ariaLabel', { label: pickerLabel.toLowerCase() })}>
      <span className={cx('label')}>{pickerLabel}:</span>
      {allLabel && (
        <ButtonPrime
          variant={!value ? 'ink' : 'outline'}
          size="sm"
          className={cx('pill')}
          aria-pressed={!value}
          onClick={() => onChange('')}
        >
          {allLabel}
        </ButtonPrime>
      )}
      {pills.map((pill) => (
        <ButtonPrime
          key={pill.id}
          variant={pill.id === value ? 'ink' : 'outline'}
          size="sm"
          className={cx('pill')}
          title={pill.name}
          aria-pressed={pill.id === value}
          onClick={() => pill.id !== value && onChange(pill.id)}
        >
          <span className={cx('dot', `dot-${pill.vendor}`)} aria-hidden="true" />
          {pill.label}
          {countOf(pill.id)}
        </ButtonPrime>
      ))}
    </div>
  );
}

export default ExamPillPicker;
