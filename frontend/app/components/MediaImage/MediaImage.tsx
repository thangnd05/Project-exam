'use client';

import Image from 'next/image';

const OPTIMIZED_HOSTS = new Set(['res.cloudinary.com']);

const canOptimize = (src: string) => {
  try {
    return OPTIMIZED_HOSTS.has(new URL(src).hostname);
  } catch {
    return src.startsWith('/');
  }
};

type MediaImageProps = {
  src?: string | null;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  sizes?: string;
  priority?: boolean;
};

function MediaImage({
  src,
  alt,
  className,
  width = 1200,
  height = 800,
  sizes = '(max-width: 768px) 100vw, 800px',
  priority = false,
}: MediaImageProps) {
  if (!src) return null;

  if (!canOptimize(src)) {
    // eslint-disable-next-line @next/next/no-img-element -- host ngoài danh sách, next/image sẽ chặn
    return <img src={src} alt={alt} className={className} loading="lazy" decoding="async" />;
  }

  return (
    <Image
      src={src}
      alt={alt}
      className={className}
      width={width}
      height={height}
      sizes={sizes}
      priority={priority}
      style={{ width: '100%', height: 'auto' }}
    />
  );
}

export default MediaImage;
