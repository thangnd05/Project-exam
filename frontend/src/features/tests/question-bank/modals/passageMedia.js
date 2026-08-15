'use client';

import classNames from 'classnames/bind';

import styles from './EditQuestionModal.module.scss';

const cx = classNames.bind(styles);

const AUDIO_EXT = /\.(mp3|wav|ogg|m4a)(\?.*)?$/i;
const IMAGE_EXT = /\.(png|jpe?g|gif|webp|svg)(\?.*)?$/i;

const passageMediaOf = (questionDetail) =>
  Array.isArray(questionDetail?.passageMedia) ? questionDetail.passageMedia : [];

/** Media của passage, kèm fallback passage.mediaUrl khi chưa tách sang passage_media. */
export const getPassageMediaItems = (questionDetail) => {
  if (!questionDetail) return [];

  const items = passageMediaOf(questionDetail)
    .map((m) => ({
      id: m?.id ?? null,
      mediaUrl: m?.mediaUrl || '',
      mediaType: (m?.mediaType || '').toUpperCase(),
    }))
    .filter((m) => !!m.mediaUrl);

  const fallbackUrl = questionDetail?.passage?.mediaUrl;
  if (fallbackUrl && !items.some((m) => m.mediaUrl === fallbackUrl)) {
    items.push({
      id: null,
      mediaUrl: fallbackUrl,
      mediaType:
        (questionDetail?.passage?.passageType || '').toUpperCase() === 'LISTENING'
          ? 'AUDIO'
          : 'IMAGE',
    });
  }
  return items;
};

/** Các đoạn text phụ của passage (passage_media type = TEXT). */
export const getExtraTextContents = (questionDetail) =>
  passageMediaOf(questionDetail)
    .filter((m) => (m?.mediaType || '').toUpperCase() === 'TEXT')
    .map((m) => m?.content || '')
    .filter(Boolean);

export const resolveMediaKind = (item) => {
  const url = item?.mediaUrl || '';
  if (item?.mediaType === 'AUDIO' || AUDIO_EXT.test(url)) return 'AUDIO';
  if (item?.mediaType === 'IMAGE' || IMAGE_EXT.test(url)) return 'IMAGE';
  return 'DOCUMENT';
};

const KIND_LABEL = {AUDIO: 'Audio', IMAGE: 'Ảnh', DOCUMENT: 'Tài liệu'};

/** Thẻ hiển thị 1 media; `actions` để trang edit chèn nút xoá. */
export function PassageMediaCard({item, index, actions = null}) {
  const url = item.mediaUrl;
  const kind = resolveMediaKind(item);

  return (
    <div className={cx('existingMediaCard')}>
      <div className={cx('existingMediaMeta')}>
        <span>
          {KIND_LABEL[kind]}{' '}
          ·{' '}
          <a href={url} target="_blank" rel="noreferrer">
            Mở file
          </a>
        </span>
        {actions}
      </div>

      {kind === 'AUDIO' ? (
        <audio controls src={url} className={cx('existingMediaAudio')} />
      ) : kind === 'IMAGE' ? (
        <img
          src={url}
          alt={`passage-media-${index + 1}`}
          className={cx('existingMediaImage')}
        />
      ) : (
        <div className={cx('existingMediaDoc')}>{url}</div>
      )}
    </div>
  );
}

export function PassageMediaList({items, renderActions}) {
  if (!items?.length) return null;
  return (
    <div className={cx('existingMediaList')}>
      {items.map((item, idx) => (
        <PassageMediaCard
          key={`${item.id || item.mediaUrl}-${idx}`}
          item={item}
          index={idx}
          actions={renderActions?.(item)}
        />
      ))}
    </div>
  );
}
