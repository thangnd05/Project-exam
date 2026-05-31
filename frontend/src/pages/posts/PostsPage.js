import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import classNames from 'classnames/bind';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Eye, Heart, MessageCircle, Clock, ChevronLeft, ChevronRight, Plus, Info } from 'lucide-react';
import { getPosts, getCategories } from '~/api/postApi';
import routes from '~/config/Routes';
import PageHeader from '~/components/common/PageHeader/PageHeader';
import CreatePostModal from './modals/CreatePostModal';
import styles from './posts.module.scss';

const cx = classNames.bind(styles);
const MotionLink = motion.create(Link);

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      delay: i * 0.06,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
};

function PostsPage() {
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const pageSize = 9;

  const fetchData = useCallback(async (page = 0) => {
    try {
      const [catsData, postsData] = await Promise.all([
        getCategories(),
        getPosts({
          page,
          size: pageSize,
          categoryId: selectedCategory,
          keyword: searchQuery,
          status: 'APPROVED'
        })
      ]);

      setCategories(catsData || []);
      if (postsData.content) {
        setPosts(postsData.content);
        setTotalPages(postsData.totalPages);
        setCurrentPage(postsData.currentPage);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setPosts([]);
      setCategories([]);
    }
  }, [selectedCategory, searchQuery]);

  useEffect(() => {
    fetchData(0);
  }, [fetchData]);

  const refreshPosts = () => fetchData(0);

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages = [];
    for (let i = 0; i < totalPages; i++) {
      if (
        i === 0 ||
        i === totalPages - 1 ||
        (i >= currentPage - 1 && i <= currentPage + 1)
      ) {
        pages.push(i);
      } else if (pages[pages.length - 1] !== '...') {
        pages.push('...');
      }
    }

    return (
      <div className={cx('pagination')}>
        <button
          className={cx('pageBtn', { disabled: currentPage === 0 })}
          onClick={() => currentPage > 0 && fetchData(currentPage - 1)}
        >
          <ChevronLeft size={20} />
        </button>

        {pages.map((p, idx) => (
          <button
            key={idx}
            className={cx('pageBtn', { active: p === currentPage, disabled: p === '...' })}
            onClick={() => typeof p === 'number' && fetchData(p)}
          >
            {typeof p === 'number' ? p + 1 : p}
          </button>
        ))}

        <button
          className={cx('pageBtn', { disabled: currentPage === totalPages - 1 })}
          onClick={() => currentPage < totalPages - 1 && fetchData(currentPage + 1)}
        >
          <ChevronRight size={20} />
        </button>
      </div>
    );
  };

  const getCategoryStyles = (categoryName) => {
    switch (categoryName) {
      case 'Lập trình': return 'bg-blue-50 text-blue-700';
      case 'Ngoại ngữ': return 'bg-green-50 text-green-700';
      case 'Kinh nghiệm ôn thi': return 'bg-pink-50 text-pink-700';
      case 'Tài liệu': return 'bg-orange-50 text-orange-700';
      case 'Chia sẻ': return 'bg-purple-50 text-purple-700';
      default: return 'bg-gray-50 text-gray-700';
    }
  };

  return (
    <div className={cx('wrapper')}>
      <div className={cx('container')}>

        {/* Header */}
        <PageHeader
          label="BLOG"
          title="Bài viết"
          actionText="Tạo bài viết"
          actionIcon={Plus}
          onAction={() => setShowCreateModal(true)}
        />

        {/* Filter Bar */}
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

        {/* Post Grid */}
        <div className={cx('postGrid')}>
          <AnimatePresence mode="popLayout">
          {posts.map((post, index) => (
            <MotionLink
              to={routes.postDetail.replace(':postId', post.id)}
              key={post.id}
              className={cx('postCard')}
              custom={index}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, y: 12, transition: { duration: 0.25 } }}
              variants={cardVariants}
              whileHover={{ y: -6 }}
            >
              <div className={cx('thumbnail')}>
                <div className={cx('cardCategory', getCategoryStyles(post.categories?.[0]?.name))}>
                  {post.categories?.[0]?.name || 'Blog'}
                </div>
                <img src={post.thumbnailUrl || 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80'} alt={post.title} />
              </div>
              <div className={cx('cardContent')}>
                <div className={cx('cardMeta')}>
                  <Clock size={14} />
                  <span>{new Date(post.createdAt).toLocaleDateString('vi-VN')}</span>
                </div>
                <h3>{post.title}</h3>
                <p className={cx('cardExcerpt')}>{post.summary || post.title}</p>
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

        {/* Pagination */}
        {renderPagination()}

        {/* Create Post Modal */}
        <CreatePostModal
          show={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onRefresh={refreshPosts}
          categories={categories}
        />

      </div>
    </div>
  );
}

export default PostsPage;
