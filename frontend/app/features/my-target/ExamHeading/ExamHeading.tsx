import classNames from 'classnames/bind';
import { badgeUrl, parseCode } from '@/app/[locale]/(public)/_lib/certificationMeta';
import type { ExamTypeResponse } from '@/app/types/exam-type';
import styles from './ExamHeading.module.scss';

const cx = classNames.bind(styles);

type ExamHeadingProps = {
  exam?: ExamTypeResponse | null;
  id?: string;
  /** Nội dung bên phải (nhãn trạng thái, nút...). */
  aside?: React.ReactNode;
  className?: string;
};

// Huy hiệu + mã kỳ thi (mono) + tên, như phần đầu nhóm ở Kho tài liệu.
function ExamHeading({ exam, id, aside, className }: ExamHeadingProps) {
  if (!exam) return null;
  const name = exam.name?.trim() ?? '';
  const code = parseCode(name);
  const badge = badgeUrl(name, code);

  return (
    <header className={cx('head', className)}>
      {badge && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={badge} alt="" className={cx('badge')} />
      )}
      <div className={cx('text')}>
        {code && <span className={cx('code')}>{code}</span>}
        <h2 id={id}>{name.replace(/\s*\([^)]*\)\s*$/, '')}</h2>
      </div>
      {aside && <div className={cx('aside')}>{aside}</div>}
    </header>
  );
}

export default ExamHeading;
