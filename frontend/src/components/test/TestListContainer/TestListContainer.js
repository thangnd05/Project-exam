import React, {useState} from 'react';
import {Container} from 'react-bootstrap';
import classNames from 'classnames/bind';
import {IoListOutline, IoGridOutline} from 'react-icons/io5';

import styles from './TestListContainer.module.scss';
import PageHeader from '~/components/common/PageHeader/PageHeader';
import PageHeaderViewToggle from '~/components/common/PageHeader/PageHeaderViewToggle';
import TestCard from '~/components/test/TestCard/TestCard';
import TestManagementTable from '~/components/test/TestManagementTable/TestManagementTable';

const cx = classNames.bind(styles);

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
}) => {
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'table'

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
          {tests.length > 0 ? (
            viewMode === 'grid' ? (
              <div className={cx('test-grid')}>
                {tests.map((test) => (
                  <TestCard
                    key={test.testId}
                    test={test}
                    countdowns={countdowns}
                  />
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
        </div>
      </Container>
    </div>
  );
};

export default TestListContainer;
