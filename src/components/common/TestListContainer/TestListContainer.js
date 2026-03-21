import React, {useState} from 'react';
import {Container} from 'react-bootstrap';
import classNames from 'classnames/bind';
import {IoListOutline, IoGridOutline} from 'react-icons/io5';

import styles from './TestListContainer.module.scss';
import PageHeader from '~/components/common/PageHeader/PageHeader';
import TestCard from '~/components/common/TestCard/TestCard';
import TestManagementTable from '~/components/common/TestManagementTable/TestManagementTable';

const cx = classNames.bind(styles);

const TestListContainer = ({
  title,
  label,
  badgeLabel,
  actionText,
  actionIcon,
  onAction,
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
        >
          <div className={cx('view-toggle')}>
            <button
              className={cx('toggle-btn', {active: viewMode === 'grid'})}
              onClick={() => setViewMode('grid')}
              title="Dạng lưới"
            >
              <IoGridOutline />
            </button>
            <button
              className={cx('toggle-btn', {active: viewMode === 'table'})}
              onClick={() => setViewMode('table')}
              title="Quản lý chi tiết (Dạng bảng)"
            >
              <IoListOutline />
            </button>
          </div>
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
