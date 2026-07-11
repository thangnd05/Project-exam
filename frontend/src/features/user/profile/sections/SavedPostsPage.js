import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import classNames from 'classnames/bind';
import { motion } from 'framer-motion';
import { Alert, Spinner, Dropdown } from 'react-bootstrap';
import { IoEyeOutline, IoHeartOutline, IoChatbubbleOutline, IoBookmarkOutline, IoSearchOutline, IoEllipsisVertical, IoChevronBackOutline, IoChevronForwardOutline, IoImageOutline } from 'react-icons/io5';
import { toast } from 'react-toastify';
import ConfirmActionModal from '~/shared/ui/modal/ConfirmActionModal';
import routes from '~/shared/config/Routes';
import { useSavedPosts, useUnsavePost } from './useSavedPosts';
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

function SavedPostsPage({ embedded = false }) {
  const navigate = useNavigate();
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [unsavingPost, setUnsavingPost] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(0);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data, isLoading, isError } = useSavedPosts({
    page: currentPage,
    size: PAGE_SIZE,
    keyword: debouncedSearch,
  });
  const posts = data?.posts ?? [];
  const totalPages = data?.totalPages ?? 0;
  const loading = isLoading;
  const errorMessage = isError ? 'Không tải được danh sách bài đã lưu.' : '';

  const unsaveMutation = useUnsavePost();

  const hasActiveFilter = debouncedSearch.trim().length > 0;

  const handleUnsave = async () => {
    if (!unsavingPost) return;
    const postId = unsavingPost.id;
    setActionLoadingId(postId);
    try {
      await unsaveMutation.mutateAsync(postId);
      toast.success('Đã bỏ lưu');
      setUnsavingPost(null);
    } catch (error) {
      toast.error('Không thể bỏ lưu. Vui lòng thử lại.');
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
              <h1 className={cx('title')}>Bài viết đã lưu</h1>
              <p className={cx('subtitle')}>Những bài viết bạn đã đánh dấu để xem lại.</p>
            </div>
            <button type="button" className={cx('backLink')} onClick={() => navigate(routes.profile)}>
              Trở lại hồ sơ
            </button>
          </header>
        )}

        <div className={cx('toolbar')}>
          <div className={cx('searchBox')}>
            <IoSearchOutline className={cx('searchIcon')} />
            <input
              type="text"
              placeholder="Tìm trong bài đã lưu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
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
              <>Không có bài viết nào khớp với từ khóa.</>
            ) : (
              <>Bạn chưa lưu bài viết nào. Mở một bài và bấm icon <IoBookmarkOutline /> để lưu lại.</>
            )}
          </Alert>
        )}

        {!loading && !errorMessage && posts.length > 0 && (
          <div className={cx('list')}>
            {posts.map((post, index) => {
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
                  <Link to={detailUrl} className={cx('thumbnailLink')}>
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
                      <span className={cx('authorMeta')}>
                        {post.authorAvatar && (
                          <img
                            src={post.authorAvatar}
                            alt={post.authorName}
                            className={cx('authorAvatar')}
                            referrerPolicy="no-referrer"
                          />
                        )}
                        <span>{post.authorName || 'Ẩn danh'}</span>
                      </span>
                      <span className={cx('date')}>{formatDate(post.createdAt)}</span>
                    </div>

                    <Link to={detailUrl} className={cx('cardTitleLink')}>
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
                      <Dropdown.Item onClick={() => navigate(detailUrl)}>
                        <IoEyeOutline /> Xem chi tiết
                      </Dropdown.Item>
                      <Dropdown.Divider />
                      <Dropdown.Item className={cx('dangerItem')} onClick={() => setUnsavingPost(post)}>
                        <IoBookmarkOutline /> Bỏ lưu
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

      <ConfirmActionModal
        show={Boolean(unsavingPost)}
        onClose={() => setUnsavingPost(null)}
        onConfirm={handleUnsave}
        icon={IoBookmarkOutline}
        title="Bỏ lưu bài viết"
        message={`Bỏ lưu bài viết "${unsavingPost?.title}"?`}
        confirmText="Bỏ lưu"
      />
    </div>
  );
}

export default SavedPostsPage;
