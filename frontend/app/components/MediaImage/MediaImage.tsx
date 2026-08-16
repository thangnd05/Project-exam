'use client';

import Image from 'next/image';

/**
 * Ảnh nội dung (đề thi, passage, banner) đến từ hai nguồn khác nhau:
 * - Ảnh do hệ thống upload → Cloudinary, host cố định, tối ưu được bằng next/image.
 * - Ảnh do admin dán link tay → host bất kỳ. next/image chặn cứng host không khai trong
 *   `images.remotePatterns` (trả 400, ảnh vỡ), nên những URL đó phải giữ <img> thường.
 *
 * Component này tự chọn nhánh theo host, để chỗ gọi không phải bận tâm.
 * Muốn thêm host vào diện tối ưu thì khai ở CẢ HAI nơi: đây và `images.remotePatterns`.
 */

const OPTIMIZED_HOSTS = new Set(['res.cloudinary.com']);

const canOptimize = (src: string) => {
  try {
    return OPTIMIZED_HOSTS.has(new URL(src).hostname);
  } catch {
    // URL tương đối (cùng origin) — cũng tối ưu được.
    return src.startsWith('/');
  }
};

type MediaImageProps = {
  src?: string | null;
  alt: string;
  className?: string;
  /** Chỉ dùng để suy tỉ lệ khung lúc chưa tải xong; CSS `height: auto` vẫn quyết định kích thước thật. */
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
