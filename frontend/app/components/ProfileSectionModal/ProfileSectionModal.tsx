'use client';

import BaseModal from '@/app/components/modal/BaseModal';
import MyEvaluationsPage from '@/app/(user)/profile/_components/MyEvaluationsPage';
import MyPostsPage from '@/app/(user)/profile/_components/MyPostsPage';
import SavedPostsPage from '@/app/(user)/profile/_components/SavedPostsPage';

type SectionConfig = {
  title: string;
  Component: React.ComponentType<{ embedded?: boolean }>;
};

const SECTIONS: Record<string, SectionConfig> = {
  evaluations: { title: 'Đánh giá của tôi', Component: MyEvaluationsPage },
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
