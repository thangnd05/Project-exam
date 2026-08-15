'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import classNames from 'classnames/bind';
import { motion } from 'framer-motion';
import { Alert, Spinner, Dropdown } from 'react-bootstrap';
import { IoEyeOutline, IoHeartOutline, IoChatbubbleOutline, IoBookmarkOutline, IoSearchOutline, IoEllipsisVertical, IoPencilOutline, IoTrashOutline, IoChevronBackOutline, IoChevronForwardOutline, IoImageOutline } from 'react-icons/io5';
import { toast } from 'react-toastify';
import { fetchPostById } from '@/app/features/posts/hooks/usePosts';
import CreatePostModal from '@/app/features/posts/modals/CreatePostModal';
import ConfirmDeleteModal from '@/app/components/modal/ConfirmDeleteModal';
import routes from '@/app/configs/Routes';
import { useMyPosts } from '@/app/features/user/profile/hooks/useMyPosts';
import styles from './PostsListPage.module.scss';

const cx = classNames.bind(styles);

const PAGE_SIZE = 5;

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] },
  }),
};

const STATUS_LABEL = {
  PENDING: { text: 'Chờ duyệt', cls: 'pending' },
  APPROVED: { text: 'Đã duyệt', cls: 'approved' },
};

const FILTER_OPTIONS = [
  { value: 'ALL', label: 'Tất cả' },
  { value: 'APPROVED', label: 'Đã duyệt' },
  { value: 'PENDING', label: 'Chờ duyệt' },
];

const formatDate = (value) => {
  if (!value) return '--';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '--';
  return d.toLocaleDateString('vi-VN', { day: 'numeric', month: 'long', year: 'numeric' });
};

const formatCount = (n) => {
  const v = Number(n) || 0;
  if (v >= 1000) return `${(v / 1000).toFixed(1).replace(/\.0$/, '')}k`;
  return String(v);
};

function MyPostsPage({ embedded = false }) {
  const router = useRouter();
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [editingPost, setEditingPost] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [deletingPost, setDeletingPost] = useState(null);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(0);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const {
    posts,
    totalPages,
    isLoading: loading,
    isError,
    refetch: fetchData,
    categories,
    deleteMutation,
  } = useMyPosts({
    page: currentPage,
    size: PAGE_SIZE,
    keyword: debouncedSearch,
    status: statusFilter,
  });

  const errorMessage = isError ? 'Không tải được danh sách bài viết của bạn.' : '';

  const hasActiveFilter = statusFilter !== 'ALL' || debouncedSearch.trim().length > 0;

  const handleEdit = async (postId) => {
    setActionLoadingId(postId);
    try {
      const fullPost = await fetchPostById(postId);
      setEditingPost(fullPost);
      setShowEditModal(true);
    } catch (error) {
      toast.error('Không tải được nội dung bài viết để chỉnh sửa.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCloseEdit = () => {
    setShowEditModal(false);
    setEditingPost(null);
  };

  const handleDelete = async () => {
    if (!deletingPost) return;
    const postId = deletingPost.id;
    setActionLoadingId(postId);
    try {
      await deleteMutation.mutateAsync(postId);
      toast.success('Đã xóa bài viết');
      setDeletingPost(null);
    } catch (error) {
      toast.error('Không thể xóa bài viết. Vui lòng thử lại.');
    } finally {
      setActionLoadingId(null);
    }
  };

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
          type="button"
          className={cx('pageBtn', { disabled: currentPage === 0 })}
          onClick={() => currentPage > 0 && setCurrentPage(currentPage - 1)}
          disabled={currentPage === 0}
        >
          <IoChevronBackOutline />
        </button>

        {pages.map((p, idx) => (
          <button
            type="button"
            key={`${p}-${idx}`}
            className={cx('pageBtn', { active: p === currentPage, ellipsis: p === '...' })}
            onClick={() => typeof p === 'number' && setCurrentPage(p)}
            disabled={p === '...'}
          >
            {typeof p === 'number' ? p + 1 : p}
          </button>
        ))}

        <button
          type="button"
          className={cx('pageBtn', { disabled: currentPage >= totalPages - 1 })}
          onClick={() => currentPage < totalPages - 1 && setCurrentPage(currentPage + 1)}
          disabled={currentPage >= totalPages - 1}
        >
          <IoChevronForwardOutline />
        </button>
      </div>
    );
  };

  return (
    <div className={cx({ wrapper: !embedded })}>
      <div className={cx({ container: !embedded })}>
        {!embedded && (
          <header className={cx('pageHeader')}>
            <div>
              <h1 className={cx('title')}>Bài viết của tôi</h1>
              <p className={cx('subtitle')}>Quản lý và theo dõi trạng thái các bài viết của bạn.</p>
            </div>
            <button type="button" className={cx('backLink')} onClick={() => router.push(routes.profile)}>
              Trở lại hồ sơ
            </button>
          </header>
        )}

        <div className={cx('toolbar')}>
          <div className={cx('searchBox')}>
            <IoSearchOutline className={cx('searchIcon')} />
            <input
              type="text"
              placeholder="Tìm kiếm bài viết..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className={cx('filterPills')}>
            {FILTER_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={cx('pill', { active: statusFilter === opt.value })}
                onClick={() => {
                  setStatusFilter(opt.value);
                  setCurrentPage(0);
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {loading && (
          <div className={cx('loadingWrap')}>
            <Spinner animation="border" />
            <span>Đang tải...</span>
          </div>
        )}

        {!loading && errorMessage && (
          <Alert variant="danger" className={cx('alertBox')}>{errorMessage}</Alert>
        )}

        {!loading && !errorMessage && posts.length === 0 && (
          <Alert variant="info" className={cx('alertBox')}>
            {hasActiveFilter ? (
              <>Không có bài viết nào khớp với bộ lọc hiện tại.</>
            ) : (
              <>Bạn chưa đăng bài viết nào. <Link href={routes.posts}>Tạo bài viết đầu tiên</Link>.</>
            )}
          </Alert>
        )}

        {!loading && !errorMessage && posts.length > 0 && (
          <div className={cx('list')}>
            {posts.map((post, index) => {
              const status = STATUS_LABEL[post.status] || { text: post.status, cls: '' };
              const detailUrl = routes.postDetail.replace(':postId', post.id);
              return (
                <motion.article
                  key={post.id}
                  className={cx('card')}
                  custom={index}
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  whileHover={{ y: -4 }}
                >
                  <Link href={detailUrl} className={cx('thumbnailLink')}>
                    {post.thumbnailUrl ? (
                      <img
                        src={post.thumbnailUrl}
                        alt={post.title}
                        className={cx('thumbnail')}
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className={cx('thumbnailPlaceholder')}>
                        <IoImageOutline size={32} />
                      </div>
                    )}
                  </Link>

                  <div className={cx('cardBody')}>
                    <div className={cx('cardMeta')}>
                      <span className={cx('statusBadge', status.cls)}>{status.text.toUpperCase()}</span>
                      <span className={cx('date')}>{formatDate(post.createdAt)}</span>
                    </div>

                    <Link href={detailUrl} className={cx('cardTitleLink')}>
                      <h3 className={cx('cardTitle')}>{post.title}</h3>
                    </Link>

                    <div className={cx('stats')}>
                      <span><IoEyeOutline /> {formatCount(post.viewCount)}</span>
                      <span><IoHeartOutline /> {formatCount(post.totalReacts)}</span>
                      <span><IoChatbubbleOutline /> {formatCount(post.commentCount)}</span>
                      <span title="Lượt lưu"><IoBookmarkOutline /> {formatCount(post.saveCount)}</span>
                    </div>
                  </div>

                  <Dropdown align="end" className={cx('cardMenu')}>
                    <Dropdown.Toggle as="button" className={cx('menuToggle')} disabled={actionLoadingId === post.id}>
                      <IoEllipsisVertical />
                    </Dropdown.Toggle>
                    <Dropdown.Menu className={cx('menuDropdown')}>
                      <Dropdown.Item onClick={() => handleEdit(post.id)}>
                        <IoPencilOutline /> Chỉnh sửa
                      </Dropdown.Item>
                      <Dropdown.Item onClick={() => router.push(detailUrl)}>
                        <IoEyeOutline /> Xem chi tiết
                      </Dropdown.Item>
                      <Dropdown.Divider />
                      <Dropdown.Item className={cx('dangerItem')} onClick={() => setDeletingPost(post)}>
                        <IoTrashOutline /> Xóa bài viết
                      </Dropdown.Item>
                    </Dropdown.Menu>
                  </Dropdown>
                </motion.article>
              );
            })}
          </div>
        )}

        {!loading && !errorMessage && renderPagination()}
      </div>

      <CreatePostModal
        show={showEditModal}
        onClose={handleCloseEdit}
        onRefresh={fetchData}
        categories={categories}
        editingPost={editingPost}
      />

      <ConfirmDeleteModal
        show={Boolean(deletingPost)}
        onClose={() => setDeletingPost(null)}
        onConfirm={handleDelete}
        title="Xác nhận xóa bài viết"
        message={`Xóa bài viết "${deletingPost?.title}"? Hành động này không thể hoàn tác.`}
      />
    </div>
  );
}

export default MyPostsPage;
