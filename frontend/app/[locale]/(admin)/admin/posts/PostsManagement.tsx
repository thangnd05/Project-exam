'use client';

import { useState, useEffect } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Badge, Button } from 'react-bootstrap';
import { Eye, CheckCircle, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';
import classNames from 'classnames/bind';

import routes from '@/app/configs/Routes';
import useDebouncedValue from '@/app/hooks/useDebouncedValue';
import ConfirmDeleteModal from '@/app/components/modal/ConfirmDeleteModal';
import ConfirmModal from '@/app/components/modal/ConfirmModal';
import { AdminPageHeader, AdminTable, AdminToolbar } from '@/app/[locale]/(admin)/_components/common';
import type { AdminTableColumn } from '@/app/[locale]/(admin)/_components/common/AdminTable';
import styles from '@/app/[locale]/(admin)/_components/common/adminKit.module.scss';
import { PostStatus } from '@/app/enums';
import type { PostSummaryResponse } from '@/app/types';

const cx = classNames.bind(styles);
import { useAdminPosts, useApprovePost, useDeletePost } from './_hooks/useAdminPosts';

const STATUS_VARIANT: Record<string, string> = { APPROVED: 'success', PENDING: 'warning' };

const STATUS_FILTERS = [
    { value: 'PENDING', labelKey: 'pending' },
    { value: 'APPROVED', labelKey: 'approved' },
    { value: 'ALL', labelKey: 'all' },
] as const;

const PostsManagement = () => {
    const t = useTranslations('AdminUsers');
    const locale = useLocale();
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('PENDING');
    const [currentPage, setCurrentPage] = useState(0);
    const [approvingPost, setApprovingPost] = useState<PostSummaryResponse | null>(null);
    const [deletingPost, setDeletingPost] = useState<PostSummaryResponse | null>(null);

    const PAGE_SIZE = 10;
    const debouncedSearch = useDebouncedValue(searchQuery, 300);

    // Đổi bộ lọc hoặc từ khoá thì quay về trang đầu
    const [prevFilters, setPrevFilters] = useState({ statusFilter, debouncedSearch });
    if (prevFilters.statusFilter !== statusFilter || prevFilters.debouncedSearch !== debouncedSearch) {
        setPrevFilters({ statusFilter, debouncedSearch });
        setCurrentPage(0);
    }

    const {
        posts,
        totalPages,
        totalElements,
        isLoading: loading,
        isError,
    } = useAdminPosts({
        page: currentPage,
        size: PAGE_SIZE,
        status: statusFilter,
        keyword: debouncedSearch,
    });
    const approvePost = useApprovePost();
    const deletePostMutation = useDeletePost();

    useEffect(() => {
        if (isError) {
            toast.error(t('posts.toast.loadError'));
        }
    }, [isError, t]);

    const handleApprove = () => {
        if (!approvingPost) return;
        approvePost.mutate(approvingPost.id, {
            onSuccess: () => {
                toast.success(t('posts.toast.approved'));
                setApprovingPost(null);
            },
            onError: () => {
                toast.error(t('posts.toast.approveError'));
            },
        });
    };

    const handleDelete = () => {
        if (!deletingPost) return;
        deletePostMutation.mutate(deletingPost.id, {
            onSuccess: () => {
                toast.success(t('posts.toast.deleted'));
                setDeletingPost(null);
            },
            onError: () => {
                toast.error(t('posts.toast.deleteError'));
            },
        });
    };

    const columns: AdminTableColumn[] = [
        {
            key: 'title',
            header: t('posts.columns.title'),
            render: (post: PostSummaryResponse) => (
                <div>
                    <div className="fw-semibold">{post.title}</div>
                    <div className="small text-secondary">
                        {post.categories?.[0]?.name || t('posts.noCategory')}
                    </div>
                </div>
            ),
        },
        { key: 'authorName', header: t('posts.columns.author') },
        {
            key: 'createdAt',
            header: t('posts.columns.createdAt'),
            render: (post: PostSummaryResponse) =>
                new Date(post.createdAt as string).toLocaleDateString(locale === 'en' ? 'en-US' : 'vi-VN'),
        },
        {
            key: 'status',
            header: t('posts.columns.status'),
            render: (post: PostSummaryResponse) => (
                <Badge bg={STATUS_VARIANT[post.status as string] || 'secondary'}>{post.status}</Badge>
            ),
        },
    ];

    return (
        <div className="d-flex flex-column gap-3">
            <AdminPageHeader
                title={t('posts.title')}
                description={t('posts.description')}
            />

            <AdminToolbar
                searchValue={searchQuery}
                onSearchChange={(value: string) => setSearchQuery(value)}
                searchPlaceholder={t('posts.searchPlaceholder')}
            >
                <div className="d-flex gap-2">
                    {STATUS_FILTERS.map((item) => (
                        <Button
                            key={item.value}
                            size="sm"
                            className={cx('pillBtn', {active: statusFilter === item.value})}
                            onClick={() => setStatusFilter(item.value)}
                        >
                            {t(`posts.filters.${item.labelKey}`)}
                        </Button>
                    ))}
                </div>
            </AdminToolbar>

            <AdminTable
                showIndex
                columns={columns}
                data={posts}
                loading={loading}
                emptyText={t('posts.empty')}
                getRowKey={(post: PostSummaryResponse) => post.id}
                page={currentPage}
                totalPages={totalPages}
                totalElements={totalElements}
                pageSize={PAGE_SIZE}
                itemLabel={t('posts.itemLabel')}
                onPageChange={setCurrentPage}
                rowActions={(post: PostSummaryResponse) => (
                    <>
                        <button
                            title={t('posts.viewDetail')}
                            onClick={() =>
                                window.open(
                                    routes.postDetail.replace(':postId', post.id),
                                    '_blank',
                                )
                            }
                        >
                            <Eye size={14} />
                        </button>
                        {post.status !== PostStatus.APPROVED && (
                            <button title={t('posts.approve')} onClick={() => setApprovingPost(post)}>
                                <CheckCircle size={14} />
                            </button>
                        )}
                        <button
                            className="danger"
                            title={t('posts.deletePost')}
                            onClick={() => setDeletingPost(post)}
                        >
                            <Trash2 size={14} />
                        </button>
                    </>
                )}
            />

            <ConfirmModal
                show={Boolean(approvingPost)}
                onClose={() => setApprovingPost(null)}
                onConfirm={handleApprove}
                icon={CheckCircle}
                title={t('posts.approveModal.title')}
                message={t('posts.approveModal.message', { title: approvingPost?.title ?? '' })}
                confirmText={t('posts.approve')}
            />

            <ConfirmDeleteModal
                show={Boolean(deletingPost)}
                onClose={() => setDeletingPost(null)}
                onConfirm={handleDelete}
                title={t('posts.confirmDelete.title')}
                message={t('posts.confirmDelete.message', { title: deletingPost?.title ?? '' })}
            />
        </div>
    );
};

export default PostsManagement;
