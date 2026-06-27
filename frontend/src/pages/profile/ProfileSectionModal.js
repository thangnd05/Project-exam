import { IoStar, IoNewspaperOutline, IoBookmarkOutline } from 'react-icons/io5';
import BaseModal from '~/components/common/modal/BaseModal';
import MyEvaluationsPage from './MyEvaluationsPage';
import MyPostsPage from './MyPostsPage';
import SavedPostsPage from './SavedPostsPage';

// Các mục cá nhân mở bằng modal (thay vì điều hướng sang trang riêng).
// Dùng chung cho trang hồ sơ và trang blog.
const SECTIONS = {
  evaluations: { title: 'Đánh giá của tôi', icon: IoStar, Component: MyEvaluationsPage },
  posts: { title: 'Bài viết của tôi', icon: IoNewspaperOutline, Component: MyPostsPage },
  saved: { title: 'Bài đã lưu', icon: IoBookmarkOutline, Component: SavedPostsPage },
};

export const PROFILE_SECTION_KEYS = Object.keys(SECTIONS);

/**
 * Modal chứa nội dung một mục cá nhân (bài viết của tôi / đã lưu / đánh giá).
 * @param {string|null} section khóa mục đang mở (null = đóng)
 * @param {() => void} onClose
 */
export default function ProfileSectionModal({ section, onClose }) {
  const config = section ? SECTIONS[section] : null;
  if (!config) return null;

  const { title, icon, Component } = config;
  return (
    <BaseModal show onClose={onClose} title={title} icon={icon} maxWidth={1040}>
      <Component embedded />
    </BaseModal>
  );
}
