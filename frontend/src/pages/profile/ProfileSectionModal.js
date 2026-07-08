import BaseModal from '~/components/common/modal/BaseModal';
import MyEvaluationsPage from './MyEvaluationsPage';
import MyPostsPage from './MyPostsPage';
import SavedPostsPage from './SavedPostsPage';

const SECTIONS = {
  evaluations: { title: 'Đánh giá của tôi', Component: MyEvaluationsPage },
  posts: { title: 'Bài viết của tôi', Component: MyPostsPage },
  saved: { title: 'Bài đã lưu', Component: SavedPostsPage },
};

export const PROFILE_SECTION_KEYS = Object.keys(SECTIONS);

export default function ProfileSectionModal({ section, onClose }) {
  const config = section ? SECTIONS[section] : null;
  if (!config) return null;

  const { title, Component } = config;
  return (
    <BaseModal show onClose={onClose} title={title} maxWidth={1040}>
      <Component embedded />
    </BaseModal>
  );
}
