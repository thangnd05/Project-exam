import classNames from 'classnames/bind';
import styles from './AvatarWithCosmetic.module.scss';

const cx = classNames.bind(styles);

// Suy ra kiểu khung: ưu tiên frameStyle, fallback theo dữ liệu có sẵn.
function resolveStyle(frame) {
  if (!frame) return null;
  if (frame.frameStyle) return frame.frameStyle;
  if (frame.imageUrl) return 'IMAGE';
  return 'COLOR';
}

/**
 * Avatar kèm khung (frame) + huy hiệu (badge).
 * frame: { frameStyle: COLOR|EFFECT|IMAGE, assetValue, imageUrl }.
 *  - COLOR: vòng viền màu/gradient (assetValue).
 *  - EFFECT: vòng có hiệu ứng CSS (assetValue = glow|pulse|rotate|rainbow).
 *  - IMAGE: overlay ảnh PNG/GIF trong suốt quanh avatar (imageUrl).
 */
function AvatarWithCosmetic({ src, fallbackSrc, alt = 'Avatar', size = 40, frame, badge, className }) {
  const ring = Math.max(2, Math.round(size * 0.07));
  // Huy hiệu ảnh để to hơn emoji. Avatar nhỏ thì tỉ lệ lớn hơn để vẫn nhìn rõ,
  // avatar to thì tỉ lệ nhỏ lại cho cân (không lấn hết mặt).
  // Huy hiệu to ≈ avatar nhưng đẩy lú ra góc dưới-phải -> chỉ đè góc, không che mặt.
  const badgeRatio = size <= 48 ? (badge?.imageUrl ? 0.9 : 0.72) : (badge?.imageUrl ? 0.68 : 0.56);
  const badgeSize = Math.max(24, Math.round(size * badgeRatio));
  // Đẩy badge ra ngoài ~1/3 cạnh để nó nằm ở góc dưới-phải avatar.
  const badgeOffset = -Math.round(badgeSize * 0.32);
  const style = resolveStyle(frame);
  const isImage = style === 'IMAGE' && frame?.imageUrl;
  const isEffect = style === 'EFFECT';
  const isColor = !!frame && !isImage && !isEffect;

  // COLOR/EFFECT dùng vòng phía sau (avatar không bị xoay theo). IMAGE giữ box = size.
  const pad = isColor || isEffect ? ring : 0;
  const box = size + pad * 2;

  const imgEl = (
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
