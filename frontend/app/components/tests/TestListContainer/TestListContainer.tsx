'use client';

import { useState } from 'react';
import {Container} from 'react-bootstrap';
import classNames from 'classnames/bind';
import {motion} from 'framer-motion';
import type {Variants} from 'framer-motion';
import {IoListOutline, IoGridOutline} from 'react-icons/io5';

import styles from './TestListContainer.module.scss';
import PageHeader from '@/app/components/PageHeader/PageHeader';
import PageHeaderViewToggle from '@/app/components/PageHeader/PageHeaderViewToggle';
import TestCard from '@/app/components/tests/TestCard/TestCard';
import TestManagementTable from '@/app/components/tests/TestManagementTable/TestManagementTable';
import type {TestResponse} from '@/app/types';

const cx = classNames.bind(styles);

const cardVariants: Variants = {
  hidden: {opacity: 0, y: 24},
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {duration: 0.5, delay: i * 0.06, ease: [0.22, 1, 0.36, 1]},
  }),
};

type TestListContainerProps = {
  title: string;
  label?: string;
  badgeLabel?: React.ReactNode;
  actionText?: string;
  actionIcon?: React.ElementType;
  onAction?: () => void;
  secondaryActionText?: string;
  secondaryActionIcon?: React.ElementType;
  onSecondaryAction?: () => void;
  tests?: TestResponse[];
  countdowns?: Record<string, number>;
  handleDeleteTest?: (testId: string) => void;
  emptyState?: React.ReactNode;
  // Prop nhận vào nhưng hiện chưa dùng — giữ nguyên như bản JS cũ
  loading?: boolean;
  onRefresh?: () => void;
  footer?: React.ReactNode;
  topSlot?: React.ReactNode;
};

const TestListContainer = ({
  title,
  label,
  badgeLabel,
  actionText,
  actionIcon,
  onAction,
  secondaryActionText,
  secondaryActionIcon,
  onSecondaryAction,
  tests = [],
  countdowns = {},
  handleDeleteTest,
  emptyState,
  loading,
  onRefresh,
  footer,
  topSlot,
}: TestListContainerProps) => {
  const [viewMode, setViewMode] = useState('grid');

  return (
    <div className={cx('wrapper')}>
      <Container>
        <PageHeader
          title={title}
          label={label}
          badgeLabel={badgeLabel}
          actionText={actionText}
          actionIcon={actionIcon}
          onAction={onAction}
          secondaryActionText={secondaryActionText}
          secondaryActionIcon={secondaryActionIcon}
          onSecondaryAction={onSecondaryAction}
        >
          {tests.length > 0 && (
            <PageHeaderViewToggle
              activeKey={viewMode}
              onChange={setViewMode}
              options={[
                {key: 'grid', title: 'Dạng lưới', icon: IoGridOutline},
                {
                  key: 'table',
                  title: 'Quản lý chi tiết (Dạng bảng)',
                  icon: IoListOutline,
                },
              ]}
            />
          )}
        </PageHeader>

        <div className={cx('content-section')}>
          {topSlot}
          {tests.length > 0 ? (
            viewMode === 'grid' ? (
              <div className={cx('test-grid')}>
                {tests.map((test, index) => (
                  <motion.div
                    key={test.testId}
                    custom={index}
                    variants={cardVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{once: true, amount: 0.15}}
                  >
                    <TestCard test={test} countdowns={countdowns} />
                  </motion.div>
                ))}
              </div>
            ) : (
              <TestManagementTable
                tests={tests}
                onDelete={handleDeleteTest}
                onRefresh={onRefresh}
                countdowns={countdowns}
              />
            )
          ) : (
            emptyState || (
              <div className={cx('empty-state')}>
                <h4>Kho lưu trữ hiện đang trống</h4>
                <p>Chưa có bài kiểm tra nào được hiển thị ở đây.</p>
              </div>
            )
          )}

          {footer}
        </div>
      </Container>
    </div>
  );
};

export default TestListContainer;
