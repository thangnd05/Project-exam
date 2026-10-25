'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

import { AdminTable } from '@/app/[locale]/(admin)/_components/common';
import type { AdminTableColumn } from '@/app/[locale]/(admin)/_components/common/AdminTable';
import { useTestUsage } from '@/app/[locale]/(admin)/_hooks/useDashboardStats';
import type { TestUsageStat } from '@/app/types/admin';

const PAGE_SIZE = 10;

// Đề công khai được làm nhiều nhất (gộp thi thật + ôn luyện), phân trang phía server.
export const TestUsageTable = () => {
    const t = useTranslations('AdminCommon.contentInsights');
    const [page, setPage] = useState(0);
    const { tests, totalPages, totalElements, isLoading } = useTestUsage(page, PAGE_SIZE);

    const columns: AdminTableColumn<TestUsageStat>[] = [
        { key: 'title', header: t('test'), render: (row) => row.title ?? '—' },
        { key: 'attempts', header: t('attempts'), align: 'right', width: 120 },
        { key: 'users', header: t('users'), align: 'right', width: 140 },
    ];

    return (
        <AdminTable
            showIndex
            columns={columns}
            data={tests}
            loading={isLoading}
            emptyText={t('empty')}
            itemLabel={t('itemLabel')}
            getRowKey={(row) => row.testId}
            page={page}
            totalPages={totalPages}
            totalElements={totalElements}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
        />
    );
};
