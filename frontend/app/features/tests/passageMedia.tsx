'use client';

import classNames from 'classnames/bind';
import type { QuestionAdminResponse } from '@/app/types';

import styles from './EditQuestionModal.module.scss';
import MediaImage from '@/app/components/MediaImage/MediaImage';

const cx = classNames.bind(styles);

const AUDIO_EXT = /\.(mp3|wav|ogg|m4a)(\?.*)?$/i;
const IMAGE_EXT = /\.(png|jpe?g|gif|webp|svg)(\?.*)?$/i;

export type PassageMediaItem = {
  id: string | null;
  mediaUrl: string;
  mediaType: string;
};

const passageMediaOf = (questionDetail?: QuestionAdminResponse | null) =>
  Array.isArray(questionDetail?.passageMedia) ? questionDetail!.passageMedia! : [];

export const getPassageMediaItems = (
  questionDetail?: QuestionAdminResponse | null,
): PassageMediaItem[] => {
  if (!questionDetail) return [];

  const items: PassageMediaItem[] = passageMediaOf(questionDetail)
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

export const getExtraTextContents = (questionDetail?: QuestionAdminResponse | null): string[] =>
  passageMediaOf(questionDetail)
    .filter((m) => (m?.mediaType || '').toUpperCase() === 'TEXT')
    .map((m) => m?.content || '')
    .filter(Boolean);

export const resolveMediaKind = (item?: PassageMediaItem | null) => {
  const url = item?.mediaUrl || '';
  if (item?.mediaType === 'AUDIO' || AUDIO_EXT.test(url)) return 'AUDIO';
  if (item?.mediaType === 'IMAGE' || IMAGE_EXT.test(url)) return 'IMAGE';
  return 'DOCUMENT';
};

const KIND_LABEL: Record<string, string> = {AUDIO: 'Audio', IMAGE: 'Ảnh', DOCUMENT: 'Tài liệu'};

type PassageMediaCardProps = {
  item: PassageMediaItem;
  index: number;
  actions?: React.ReactNode;
};

export function PassageMediaCard({item, index, actions = null}: PassageMediaCardProps) {
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
        <MediaImage
          src={url}
          alt={`passage-media-${index + 1}`}
          className={cx('existingMediaImage')}
          width={600}
          height={260}
          sizes="(max-width: 768px) 100vw, 600px"
        />
      ) : (
        <div className={cx('existingMediaDoc')}>{url}</div>
      )}
    </div>
  );
}

type PassageMediaListProps = {
  items?: PassageMediaItem[] | null;
  renderActions?: (item: PassageMediaItem) => React.ReactNode;
};

export function PassageMediaList({items, renderActions}: PassageMediaListProps) {
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
