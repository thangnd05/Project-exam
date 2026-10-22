'use client';

import Link, { useLocalizeHref, useRouter } from '@/app/i18n/navigation';
import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import classNames from 'classnames/bind';
import { motion, type Variants } from 'framer-motion';
import { Alert, Spinner, Dropdown } from 'react-bootstrap';
import { IoEyeOutline, IoHeartOutline, IoChatbubbleOutline, IoBookmarkOutline, IoSearchOutline, IoEllipsisVertical, IoPencilOutline, IoTrashOutline, IoChevronBackOutline, IoChevronForwardOutline, IoImageOutline } from 'react-icons/io5';
import { toast } from 'react-toastify';
import { fetchPostById } from '@/app/features/posts/hooks/usePosts';
import CreatePostModal from '@/app/features/posts/CreatePostModal/CreatePostModal';
import ConfirmDeleteModal from '@/app/components/modal/ConfirmDeleteModal';
import routes from '@/app/configs/Routes';
import { useMyPosts } from '@/app/features/posts/ProfileSectionModal/useMyPosts';
import type { PostResponse, PostSummaryResponse } from '@/app/types';
import styles from '@/app/features/posts/ProfileSectionModal/PostsListPage.module.scss';
import MediaImage from '@/app/components/MediaImage/MediaImage';

const cx = classNames.bind(styles);

const PAGE_SIZE = 5;

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] },
  }),
};

type StatusKey = 'all' | 'approved' | 'pending';

const STATUS_LABEL: Record<string, { key: StatusKey; cls: string }> = {
  PENDING: { key: 'pending', cls: 'pending' },
  APPROVED: { key: 'approved', cls: 'approved' },
};

const FILTER_OPTIONS: Array<{ value: string; labelKey: StatusKey }> = [
  { value: 'ALL', labelKey: 'all' },
  { value: 'APPROVED', labelKey: 'approved' },
  { value: 'PENDING', labelKey: 'pending' },
];

const formatDate = (value: string | null | undefined, locale: string) => {
  if (!value) return '--';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '--';
  return d.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' });
};

const formatCount = (n: unknown) => {
  const v = Number(n) || 0;
  if (v >= 1000) return `${(v / 1000).toFixed(1).replace(/\.0$/, '')}k`;
  return String(v);
};

type MyPostsPageProps = {
  embedded?: boolean;
};

function MyPostsPage({ embedded = false }: MyPostsPageProps) {
  const router = useRouter();
  const t = useTranslations('Posts');
  const localizeHref = useLocalizeHref();
  const dateLocale = useLocale() === 'en' ? 'en-US' : 'vi-VN';
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [editingPost, setEditingPost] = useState<PostResponse | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [deletingPost, setDeletingPost] = useState<PostSummaryResponse | null>(null);
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

  const errorMessage = isError ? t('myPosts.loadError') : '';

  const hasActiveFilter = statusFilter !== 'ALL' || debouncedSearch.trim().length > 0;

  const handleEdit = async (postId: string) => {
    setActionLoadingId(postId);
    try {
      const fullPost = await fetchPostById(postId);
      setEditingPost(fullPost);
      setShowEditModal(true);
    } catch {
      toast.error(t('myPosts.editLoadError'));
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
      toast.success(t('myPosts.deleted'));
      setDeletingPost(null);
    } catch {
      toast.error(t('myPosts.deleteError'));
    } finally {
      setActionLoadingId(null);
    }
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages: Array<number | string> = [];
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
              <h1 className={cx('title')}>{t('common.myPosts')}</h1>
              <p className={cx('subtitle')}>{t('myPosts.subtitle')}</p>
            </div>
            <button type="button" className={cx('backLink')} onClick={() => router.push(localizeHref(routes.dashboard))}>
              {t('common.backToProfile')}
            </button>
          </header>
        )}

        <div className={cx('toolbar')}>
          <div className={cx('searchBox')}>
            <IoSearchOutline className={cx('searchIcon')} />
            <input
              type="text"
              placeholder={t('myPosts.searchPlaceholder')}
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
                {t(`myPosts.status.${opt.labelKey}`)}
              </button>
            ))}
          </div>
        </div>

        {loading && (
          <div className={cx('loadingWrap')}>
            <Spinner animation="border" />
            <span>{t('common.loading')}</span>
          </div>
        )}

        {!loading && errorMessage && (
          <Alert variant="danger" className={cx('alertBox')}>{errorMessage}</Alert>
        )}

        {!loading && !errorMessage && posts.length === 0 && (
          <Alert variant="info" className={cx('alertBox')}>
            {hasActiveFilter ? (
              <>{t('myPosts.emptyFiltered')}</>
            ) : (
              <>{t.rich('myPosts.empty', { link: (chunks) => <Link href={routes.posts}>{chunks}</Link> })}</>
            )}
          </Alert>
        )}

        {!loading && !errorMessage && posts.length > 0 && (
          <div className={cx('list')}>
            {posts.map((post, index) => {
              const statusLabel = post.status ? STATUS_LABEL[post.status] : undefined;
              const status = statusLabel
                ? { text: t(`myPosts.status.${statusLabel.key}`), cls: statusLabel.cls }
                : { text: post.status || '', cls: '' };
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
                      <MediaImage
                        cover
                        src={post.thumbnailUrl}
                        alt={post.title ?? ''}
                        className={cx('thumbnail')}
                        referrerPolicy="no-referrer"
                        width={400}
                        height={225}
                        sizes="400px"
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
                      <span className={cx('date')}>{formatDate(post.createdAt, dateLocale)}</span>
                    </div>

                    <Link href={detailUrl} className={cx('cardTitleLink')}>
                      <h3 className={cx('cardTitle')}>{post.title}</h3>
                    </Link>

                    <div className={cx('stats')}>
                      <span><IoEyeOutline /> {formatCount(post.viewCount)}</span>
                      <span><IoHeartOutline /> {formatCount(post.totalReacts)}</span>
                      <span><IoChatbubbleOutline /> {formatCount(post.commentCount)}</span>
                      <span title={t('common.saves')}><IoBookmarkOutline /> {formatCount(post.saveCount)}</span>
                    </div>
                  </div>

                  <Dropdown align="end" className={cx('cardMenu')}>
                    <Dropdown.Toggle as="button" className={cx('menuToggle')} disabled={actionLoadingId === post.id}>
                      <IoEllipsisVertical />
                    </Dropdown.Toggle>
                    <Dropdown.Menu className={cx('menuDropdown')}>
                      <Dropdown.Item onClick={() => handleEdit(post.id)}>
                        <IoPencilOutline /> {t('myPosts.edit')}
                      </Dropdown.Item>
                      <Dropdown.Item onClick={() => router.push(localizeHref(detailUrl))}>
                        <IoEyeOutline /> {t('common.viewDetail')}
                      </Dropdown.Item>
                      <Dropdown.Divider />
                      <Dropdown.Item className={cx('dangerItem')} onClick={() => setDeletingPost(post)}>
                        <IoTrashOutline /> {t('myPosts.delete')}
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
        title={t('myPosts.deleteTitle')}
        message={t('myPosts.deleteMessage', { title: deletingPost?.title ?? '' })}
      />
    </div>
  );
}

export default MyPostsPage;
