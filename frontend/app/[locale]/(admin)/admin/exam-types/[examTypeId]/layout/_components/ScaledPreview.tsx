'use client';

import { useLayoutEffect, useRef, useState } from 'react';

type ScaledPreviewProps = {
  // Kích thước màn hình giả lập: phòng thi được dựng đúng cỡ này rồi thu nhỏ cho vừa khung.
  width: number;
  height: number;
  children: React.ReactNode;
};

// Phòng thi dùng media query theo cửa sổ, nên xem trước trong khung hẹp sẽ bị bóp méo. Dựng ở cỡ desktop thật
// rồi scale xuống để người chỉnh thấy đúng tỉ lệ bố cục.
function ScaledPreview({ width, height, children }: ScaledPreviewProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const update = () => setScale(Math.min(1, host.clientWidth / width));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(host);
    return () => observer.disconnect();
  }, [width]);

  return (
    <div ref={hostRef} style={{ width: '100%', height: height * scale, overflow: 'hidden' }}>
      <div
        style={{
          position: 'relative',
          width,
          height,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {children}
      </div>
    </div>
  );
}

export default ScaledPreview;
