'use client';

import classNames from 'classnames/bind';
import styles from './AvatarWithCosmetic.module.scss';

const cx = classNames.bind(styles);

function resolveStyle(frame) {
  if (!frame) return null;
  if (frame.frameStyle) return frame.frameStyle;
  if (frame.imageUrl) return 'IMAGE';
  return 'COLOR';
}

function AvatarWithCosmetic({ src, fallbackSrc, alt = 'Avatar', name, size = 40, frame, badge, className }) {
  const ring = Math.max(2, Math.round(size * 0.07));

  const badgeRatio = size <= 48 ? (badge?.imageUrl ? 0.9 : 0.72) : (badge?.imageUrl ? 0.68 : 0.56);
  const badgeSize = Math.max(24, Math.round(size * badgeRatio));

  const badgeOffset = -Math.round(badgeSize * 0.32);
  const style = resolveStyle(frame);
  const isImage = style === 'IMAGE' && frame?.imageUrl;
  const isEffect = style === 'EFFECT';
  const isColor = !!frame && !isImage && !isEffect;

  const pad = isColor || isEffect ? ring : 0;
  const box = size + pad * 2;

  // Không có ảnh thật (rỗng hoặc chỉ là avatar mặc định ui-avatars) => hiện
  // chữ cái đầu với nền theo theme (--primary-gradient: teal thường / vàng premium)
  const label = (name || (alt !== 'Avatar' ? alt : '') || '').trim();
  const initial = label ? label.charAt(0).toUpperCase() : '';
  const isDefaultAvatar = !src || /ui-avatars\.com/i.test(src);
  const useInitials = isDefaultAvatar && Boolean(initial);

  const imgEl = useInitials ? (
    <span
      className={cx('fallback')}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.44) }}
      aria-label={alt}
    >
      {initial}
    </span>
  ) : (
    <img
      src={src || fallbackSrc}
      alt={alt}
      className={cx('img')}
      style={{ width: size, height: size }}
      referrerPolicy="no-referrer"
      onError={(e) => {
        e.target.onerror = null;
        if (fallbackSrc) e.target.src = fallbackSrc;
      }}
    />
  );

  return (
    <div className={cx('wrap', className)} style={{ width: box, height: box }}>
      {(isColor || isEffect) && (
        <span
          className={cx('backRing', isEffect && `effect-${frame.assetValue || 'glow'}`)}
          style={isColor ? { background: frame.assetValue } : undefined}
        />
      )}

      <span className={cx('imgSlot')} style={{ width: size, height: size }}>
        {imgEl}
      </span>

      {isImage && (
        <img
          src={frame.imageUrl}
          alt=""
          aria-hidden="true"
          className={cx('overlay')}
          style={{ width: size * 1.42, height: size * 1.42, top: -size * 0.21, left: -size * 0.21 }}
          referrerPolicy="no-referrer"
        />
      )}

      {badge &&
        (badge.imageUrl ? (
          <img
            src={badge.imageUrl}
            alt=""
            aria-hidden="true"
            className={cx('badge', 'badgeImg')}
            style={{ width: badgeSize, height: badgeSize, right: badgeOffset, bottom: badgeOffset }}
            title={badge.name}
            referrerPolicy="no-referrer"
          />
        ) : (
          <span
            className={cx('badge')}
            style={{
              width: badgeSize,
              height: badgeSize,
              fontSize: Math.round(badgeSize * 0.62),
              right: badgeOffset,
              bottom: badgeOffset,
            }}
            title={badge.name}
          >
            {badge.assetValue}
          </span>
        ))}
    </div>
  );
}

export default AvatarWithCosmetic;
