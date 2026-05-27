import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import classNames from 'classnames/bind';
import { Alert, Spinner, Dropdown } from 'react-bootstrap';
import {
  IoArrowBackOutline,
  IoEyeOutline,
  IoHeartOutline,
  IoChatbubbleOutline,
  IoBookmarkOutline,
  IoSearchOutline,
  IoEllipsisVertical,
  IoPencilOutline,
  IoTrashOutline,
  IoChevronBackOutline,
  IoChevronForwardOutline,
  IoImageOutline,
} from 'react-icons/io5';
import { toast } from 'react-toastify';
import { getMyPosts, deletePost, getCategories, getPostById } from '~/api/postApi';
import CreatePostModal from '~/pages/posts/modals/CreatePostModal';
import routes from '~/config/Routes';
import styles from './PostsListPage.module.scss';

const cx = classNames.bind(styles);

const PAGE_SIZE = 5;

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

function MyPostsPage() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [categories, setCategories] = useState([]);
  const [editingPost, setEditingPost] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(0);

  const fetchData = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const data = await getMyPosts();
      const sorted = (Array.isArray(data) ? data : []).slice().sort((a, b) => {
        const da = new Date(a.createdAt || 0).getTime();
        const db = new Date(b.createdAt || 0).getTime();
        return db - da;
      });
      setPosts(sorted);
    } catch (error) {
      setErrorMessage('Không tải được danh sách bài viết của bạn.');
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    getCategories()
      .then((data) => setCategories(Array.isArray(data) ? data : []))
      .catch(() => setCategories([]));
  }, []);

  // Reset page khi filter/search đổi
  useEffect(() => {
    setCurrentPage(0);
  }, [statusFilter, searchQuery]);

  const filteredPosts = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase();
    return posts.filter((p) => {
      if (statusFilter !== 'ALL' && p.status !== statusFilter) return false;
      if (keyword && !(p.title || '').toLowerCase().includes(keyword)) return false;
      return true;
    });
  }, [posts, statusFilter, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredPosts.length / PAGE_SIZE));
  const pageItems = filteredPosts.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);

  const handleEdit = async (postId) => {
    setActionLoadingId(postId);
    try {
      const fullPost = await getPostById(postId);
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

  const handleDelete = async (postId) => {
    if (!window.confirm('Xóa bài viết này? Hành động không thể hoàn tác.')) return;
    setActionLoadingId(postId);
    try {
      await deletePost(postId);
      setPosts((prev) => prev.filter((p) => p.id !== postId));
      toast.success('Đã xóa bài viết');
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
    <div className={cx('wrapper')}>
      <div className={cx('container')}>
        <header className={cx('pageHeader')}>
          <div>
            <h1 className={cx('title')}>Bài viết của tôi</h1>
            <p className={cx('subtitle')}>Quản lý và theo dõi trạng thái các bài viết của bạn.</p>
          </div>
          <button type="button" className={cx('backLink')} onClick={() => navigate(routes.profile)}>
            <IoArrowBackOutline />
            Trở lại hồ sơ
          </button>
        </header>

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
                onClick={() => setStatusFilter(opt.value)}
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

        {!loading && !errorMessage && filteredPosts.length === 0 && (
          <Alert variant="info" className={cx('alertBox')}>
            {posts.length === 0 ? (
              <>Bạn chưa đăng bài viết nào. <Link to={routes.posts}>Tạo bài viết đầu tiên</Link>.</>
            ) : (
              <>Không có bài viết nào khớp với bộ lọc hiện tại.</>
            )}
          </Alert>
        )}

        {!loading && !errorMessage && pageItems.length > 0 && (
          <div className={cx('list')}>
            {pageItems.map((post) => {
              const status = STATUS_LABEL[post.status] || { text: post.status, cls: '' };
              const detailUrl = routes.postDetail.replace(':postId', post.id);
              return (
                <article key={post.id} className={cx('card')}>
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
                      <span className={cx('statusBadge', status.cls)}>{status.text.toUpperCase()}</span>
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
                      <Dropdown.Item onClick={() => handleEdit(post.id)}>
                        <IoPencilOutline /> Chỉnh sửa
                      </Dropdown.Item>
                      <Dropdown.Item onClick={() => navigate(detailUrl)}>
                        <IoEyeOutline /> Xem chi tiết
                      </Dropdown.Item>
                      <Dropdown.Divider />
                      <Dropdown.Item className={cx('dangerItem')} onClick={() => handleDelete(post.id)}>
                        <IoTrashOutline /> Xóa bài viết
                      </Dropdown.Item>
                    </Dropdown.Menu>
                  </Dropdown>
                </article>
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
    </div>
  );
}

export default MyPostsPage;
