'use client';

import { useState } from 'react';
import classNames from 'classnames/bind';
import styles from './ExamBadge.module.scss';

const cx = classNames.bind(styles);

const getInitials = (name?: string) => {
  const words = (name ?? '').trim().split(/\s+/).filter(Boolean);
  if (!words.length) return '?';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
};

type ExamBadgeProps = {
  sources: (string | null | undefined)[];
  name: string;
  size?: number;
  className?: string;
};

// Ưu tiên huy hiệu có sẵn trong dự án, lỗi thì thử ảnh từ API, cuối cùng là chữ viết tắt.
function ExamBadge({ sources, name, size = 64, className }: ExamBadgeProps) {
  const candidates = sources.filter(Boolean) as string[];
  const [index, setIndex] = useState(0);
  const src = candidates[index];

  return (
    <span className={cx('badge', className)} style={{ width: size, height: size }} aria-hidden="true">
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- logo do admin dán (URL ngoài tuỳ ý), chuỗi fallback qua onError
        <img src={src} alt="" onError={() => setIndex((i) => i + 1)} />
      ) : (
        <span className={cx('initials')}>{getInitials(name)}</span>
      )}
    </span>
  );
}

export default ExamBadge;
