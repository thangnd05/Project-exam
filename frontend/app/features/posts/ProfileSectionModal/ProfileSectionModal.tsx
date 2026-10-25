'use client';

import { useTranslations } from 'next-intl';
import BaseModal from '@/app/components/modal/BaseModal';
import MyPostsPage from '@/app/features/posts/ProfileSectionModal/MyPostsPage';
import SavedPostsPage from '@/app/features/posts/ProfileSectionModal/SavedPostsPage';

type SectionConfig = {
  titleKey: 'myPosts' | 'savedPosts';
  Component: React.ComponentType<{ embedded?: boolean }>;
};

const SECTIONS: Record<string, SectionConfig> = {
  posts: { titleKey: 'myPosts', Component: MyPostsPage },
  saved: { titleKey: 'savedPosts', Component: SavedPostsPage },
};

type ProfileSectionModalProps = {
  section?: string | null;
  onClose?: () => void;
};

export default function ProfileSectionModal({ section, onClose }: ProfileSectionModalProps) {
  const t = useTranslations('Posts.common');
  const config = section ? SECTIONS[section] : null;
  if (!config) return null;

  const { titleKey, Component } = config;
  return (
    <BaseModal show onClose={onClose} title={t(titleKey)} maxWidth={1040}>
      <Component embedded />
    </BaseModal>
  );
}
