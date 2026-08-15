'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import classNames from 'classnames/bind';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { Search, Eye, Heart, MessageCircle, Clock, Plus, Info, Newspaper, Bookmark } from 'lucide-react';
import { usePosts } from '@/app/hooks/usePosts';
import routes from '@/app/configs/Routes';
import PageHeader from '@/app/components/PageHeader/PageHeader';
import Pagination from '@/app/components/Pagination/Pagination';
import CreatePostModal from '@/app/components/CreatePostModal/CreatePostModal';
import ProfileSectionModal from '@/app/components/ProfileSectionModal/ProfileSectionModal';
import styles from './posts.module.scss';

const cx = classNames.bind(styles);
const MotionLink = motion.create(Link);

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      delay: i * 0.06,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
};

function Posts() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);

  const { posts, categories, totalPages, refresh } = usePosts({
    page: currentPage,
    categoryId: selectedCategory,
    keyword: searchQuery,
    status: 'APPROVED',
  });

  useEffect(() => {
    setCurrentPage(0);
  }, [selectedCategory, searchQuery]);

  const refreshPosts = () => {
    setCurrentPage(0);
    refresh();
  };

  return (
    <div className={cx('wrapper')}>
      <div className={cx('container')}>

        <PageHeader
          label="BLOG"
          title="Bài viết"
          actionText="Tạo bài viết"
          actionIcon={Plus}
          onAction={() => setShowCreateModal(true)}
        >
          <button
            type="button"
            className={cx('headerIconBtn')}
            onClick={() => setActiveSection('posts')}
            title="Bài viết của tôi"
            aria-label="Bài viết của tôi"
          >
            <Newspaper size={22} />
          </button>
          <button
            type="button"
            className={cx('headerIconBtn')}
            onClick={() => setActiveSection('saved')}
            title="Bài đã lưu"
            aria-label="Bài đã lưu"
          >
            <Bookmark size={22} />
          </button>
        </PageHeader>

        <motion.div
          className={cx('filterBar')}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className={cx('searchActions')}>
            <div className={cx('searchBox')}>
              <Search className={cx('searchIcon')} size={18} />
              <input
                type="text"
                placeholder="Tìm bài viết..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className={cx('approvalNotice')}>
            <Info size={16} />
            <span>
              Bài viết mới cần được admin duyệt trước khi hiển thị công khai.
              Nếu sau một thời gian bài của bạn không xuất hiện ở đây, có thể bài đã bị xóa do không phù hợp.
            </span>
          </div>
          <div className={cx('filterPills')}>
            <button
              className={cx('pill', { active: !selectedCategory })}
              onClick={() => setSelectedCategory(null)}
            >
              Tất cả
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                className={cx('pill', { active: selectedCategory === cat.id })}
                onClick={() => setSelectedCategory(cat.id)}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </motion.div>

        <div className={cx('postGrid')}>
          <AnimatePresence mode="popLayout">
          {posts.map((post, index) => (
            <MotionLink
              href={routes.postDetail.replace(':postId', post.id)}
              key={post.id}
              className={cx('postCard')}
              custom={index}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, y: 12, transition: { duration: 0.25 } }}
              variants={cardVariants}
            >
              <div className={cx('thumbnail')}>
                <div className={cx('cardCategory')}>
                  {post.categories?.[0]?.name || 'Blog'}
                </div>
                <img src={post.thumbnailUrl || 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80'} alt={post.title} />
              </div>
              <div className={cx('cardContent')}>
                <div className={cx('cardMeta')}>
                  <Clock size={14} />
                  <span>{new Date(post.createdAt ?? '').toLocaleDateString('vi-VN')}</span>
                </div>
                <h3>{post.title}</h3>
                {/* any có chủ đích: PostSummaryResponse từ BE không có field `summary`
                    (runtime luôn fallback về title) — giữ nguyên biểu thức cũ, không đổi hành vi */}
                <p className={cx('cardExcerpt')}>{(post as any).summary || post.title}</p>
                <div className={cx('cardFooter')}>
                  <div className={cx('author')}>
                    <img src={post.authorAvatar || 'https://i.pravatar.cc/150?img=12'} alt={post.authorName} referrerPolicy="no-referrer" />
                    <span>{post.authorName}</span>
                  </div>
                  <div className={cx('stats')}>
                    <span><Eye size={14} /> {post.viewCount || 0}</span>
                    <span><Heart size={14} /> {post.totalReacts || 0}</span>
                    <span><MessageCircle size={14} /> {post.commentCount || 0}</span>
                  </div>
                </div>
              </div>
            </MotionLink>
          ))}
          </AnimatePresence>
        </div>

        <Pagination currentPage={currentPage} totalPages={totalPages} onChange={setCurrentPage} />

        <CreatePostModal
          show={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onRefresh={refreshPosts}
          categories={categories}
        />

        <ProfileSectionModal section={activeSection} onClose={() => setActiveSection(null)} />

      </div>
    </div>
  );
}

export default Posts;
