'use client';

import Image from 'next/image';

// Phải khớp images.remotePatterns trong next.config.mjs.
const OPTIMIZED_HOSTS = new Set(['res.cloudinary.com', 'lh3.googleusercontent.com']);

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
  // Ảnh lấp đầy khung cao cố định (thumbnail, banner thẻ): giữ width/height 100% + object-fit cover
  // thay vì height:auto, để CSS của khung quyết định kích thước.
  cover?: boolean;
  referrerPolicy?: React.HTMLAttributeReferrerPolicy;
};

function MediaImage({
  src,
  alt,
  className,
  width = 1200,
  height = 800,
  sizes = '(max-width: 768px) 100vw, 800px',
  priority = false,
  cover = false,
  referrerPolicy,
}: MediaImageProps) {
  if (!src) return null;

  if (!canOptimize(src)) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- host ngoài danh sách, next/image sẽ chặn
      <img
        src={src}
        alt={alt}
        className={className}
        loading="lazy"
        decoding="async"
        referrerPolicy={referrerPolicy}
      />
    );
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
      style={cover ? { width: '100%', height: '100%', objectFit: 'cover' } : { width: '100%', height: 'auto' }}
    />
  );
}

export default MediaImage;
