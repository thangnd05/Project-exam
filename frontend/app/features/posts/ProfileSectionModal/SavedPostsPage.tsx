'use client';

import Link, { useLocalizeHref, useRouter } from '@/app/i18n/navigation';
import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import classNames from 'classnames/bind';
import { motion, type Variants } from 'framer-motion';
import { Alert, Spinner, Dropdown } from 'react-bootstrap';
import { IoEyeOutline, IoHeartOutline, IoChatbubbleOutline, IoBookmarkOutline, IoSearchOutline, IoEllipsisVertical, IoChevronBackOutline, IoChevronForwardOutline, IoImageOutline } from 'react-icons/io5';
import { toast } from 'react-toastify';
import ConfirmModal from '@/app/components/modal/ConfirmModal';
import routes from '@/app/configs/Routes';
import { useSavedPosts, useUnsavePost } from '@/app/features/posts/hooks/useSavedPosts';
import type { PostSummaryResponse } from '@/app/types';
import styles from '@/app/features/posts/ProfileSectionModal/PostsListPage.module.scss';
import MediaImage from '@/app/components/MediaImage/MediaImage';
import { formatCount, formatDate } from './postFormat';

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

type SavedPostsPageProps = {
  embedded?: boolean;
};

function SavedPostsPage({ embedded = false }: SavedPostsPageProps) {
  const router = useRouter();
  const t = useTranslations('Posts');
  const localizeHref = useLocalizeHref();
  const dateLocale = useLocale() === 'en' ? 'en-US' : 'vi-VN';
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [unsavingPost, setUnsavingPost] = useState<PostSummaryResponse | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(0);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { posts, totalPages, isLoading, isError } = useSavedPosts({
    page: currentPage,
    size: PAGE_SIZE,
    keyword: debouncedSearch,
  });
  const loading = isLoading;
  const errorMessage = isError ? t('saved.loadError') : '';

  const unsaveMutation = useUnsavePost();

  const hasActiveFilter = debouncedSearch.trim().length > 0;

  const handleUnsave = async () => {
    if (!unsavingPost) return;
    const postId = unsavingPost.id;
    setActionLoadingId(postId);
    try {
      await unsaveMutation.mutateAsync(postId);
      toast.success(t('saved.unsaved'));
      setUnsavingPost(null);
    } catch {
      toast.error(t('saved.unsaveError'));
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
              <h1 className={cx('title')}>{t('saved.title')}</h1>
              <p className={cx('subtitle')}>{t('saved.subtitle')}</p>
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
              placeholder={t('saved.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
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
              <>{t('saved.emptyFiltered')}</>
            ) : (
              <>{t.rich('saved.empty', { icon: () => <IoBookmarkOutline /> })}</>
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
                      <span className={cx('authorMeta')}>
                        {post.authorAvatar && (
                          // eslint-disable-next-line @next/next/no-img-element -- avatar tác giả từ host bất kỳ (Google, upload...)
                          <img
                            src={post.authorAvatar}
                            alt={post.authorName}
                            className={cx('authorAvatar')}
                            referrerPolicy="no-referrer"
                          />
                        )}
                        <span>{post.authorName || t('saved.anonymous')}</span>
                      </span>
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
                      <Dropdown.Item onClick={() => router.push(localizeHref(detailUrl))}>
                        <IoEyeOutline /> {t('common.viewDetail')}
                      </Dropdown.Item>
                      <Dropdown.Divider />
                      <Dropdown.Item className={cx('dangerItem')} onClick={() => setUnsavingPost(post)}>
                        <IoBookmarkOutline /> {t('saved.unsave')}
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

      <ConfirmModal
        show={Boolean(unsavingPost)}
        onClose={() => setUnsavingPost(null)}
        onConfirm={handleUnsave}
        icon={IoBookmarkOutline}
        title={t('saved.unsaveTitle')}
        message={t('saved.unsaveMessage', { title: unsavingPost?.title ?? '' })}
        confirmText={t('saved.unsave')}
        cancelText={t('saved.cancel')}
      />
    </div>
  );
}

export default SavedPostsPage;
