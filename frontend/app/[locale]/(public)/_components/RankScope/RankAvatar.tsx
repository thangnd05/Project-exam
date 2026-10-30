'use client';

import {useState} from 'react';

import {initials} from './useRankBoard';

type RankAvatarProps = {
  className?: string;
  name: string;
  src?: string | null;
};

// Ảnh mặc định ui-avatars chỉ là chữ cái trên nền màu, dùng chữ viết tắt theo tông hạng cho đồng bộ.
const isRealAvatar = (src?: string | null): src is string => Boolean(src) && !/ui-avatars\.com/i.test(src as string);

function RankAvatar({className, name, src}: RankAvatarProps) {
  const [failed, setFailed] = useState(false);
  const showImage = isRealAvatar(src) && !failed;

  return (
    <span className={className} aria-hidden="true">
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element -- avatar từ host bất kỳ (Google, upload...), lỗi thì quay về chữ viết tắt
        <img src={src} alt="" referrerPolicy="no-referrer" onError={() => setFailed(true)} />
      ) : (
        initials(name)
      )}
    </span>
  );
}

export default RankAvatar;
