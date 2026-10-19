'use client';

import BaseModal from '@/app/components/modal/BaseModal';
import MyPostsPage from '@/app/features/posts/ProfileSectionModal/MyPostsPage';
import SavedPostsPage from '@/app/features/posts/ProfileSectionModal/SavedPostsPage';

type SectionConfig = {
  title: string;
  Component: React.ComponentType<{ embedded?: boolean }>;
};

const SECTIONS: Record<string, SectionConfig> = {
  posts: { title: 'Bài viết của tôi', Component: MyPostsPage },
  saved: { title: 'Bài đã lưu', Component: SavedPostsPage },
};

export const PROFILE_SECTION_KEYS = Object.keys(SECTIONS);

type ProfileSectionModalProps = {
  section?: string | null;
  onClose?: () => void;
};

export default function ProfileSectionModal({ section, onClose }: ProfileSectionModalProps) {
  const config = section ? SECTIONS[section] : null;
  if (!config) return null;

  const { title, Component } = config;
  return (
    <BaseModal show onClose={onClose} title={title} maxWidth={1040}>
      <Component embedded />
    </BaseModal>
  );
}
