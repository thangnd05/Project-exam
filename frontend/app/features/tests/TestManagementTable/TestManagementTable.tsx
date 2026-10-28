'use client';

import { useRouter } from '@/app/i18n/navigation';
import React from 'react';
import { useTranslations } from 'next-intl';
import {Table, Badge, OverlayTrigger, Tooltip} from 'react-bootstrap';
import ButtonPrime from '@/app/components/Button/ButtonPrime';
import { Pencil, Trash2, ChartNoAxesColumnIncreasing } from 'lucide-react';
import classNames from 'classnames/bind';
import styles from '@/app/features/tests/TestManagementTable/TestManagementTable.module.scss';
import {getTestStatus} from '@/app/features/tests/testStatusHelper';
import type {TestStatusInfo} from '@/app/features/tests/testStatusHelper';
import EditTestModal from '@/app/features/tests/EditTestModal';
import type {EditableTest} from '@/app/features/tests/EditTestModal';
import type {TestResponse} from '@/app/types';
import { buildTestPath } from '@/app/configs/Routes';

const cx = classNames.bind(styles);

type TestManagementTableProps = {
  tests: TestResponse[];
  onDelete?: (testId: string) => void;
  onRefresh?: () => void;
  countdowns?: Record<string, number>;
};

const TestManagementTable = ({tests, onDelete, onRefresh, countdowns}: TestManagementTableProps) => {
  const router = useRouter();
  const t = useTranslations('TestTaking.managementTable');
  const tTests = useTranslations('Tests');
  const now = new Date();
  const [editingTest, setEditingTest] = React.useState<EditableTest | null>(null);

  const getBadgeVariant = (status: TestStatusInfo['status']) => {
    switch (status) {
      case 'open':
        return 'success';
      case 'locked':
        return 'warning';
      case 'expired':
        return 'danger';
      default:
        return 'secondary';
    }
  };

  return (
    <div className={cx('table-responsive')}>
      <Table hover className={cx('management-table')}>
        <thead>
          <tr>
            <th>{t('name')}</th>
            <th>
              {t('duration')}
            </th>
            <th>{t('status')}</th>
            <th>
              {t('totalAttempts')}
            </th>
            <th className="text-center">{t('actions')}</th>
          </tr>
        </thead>
        <tbody>
          {tests.map((test) => {
            const {status, statusLabelKey} = getTestStatus(test, now, countdowns);
            const variant = getBadgeVariant(status);

            return (
              <tr key={test.testId}>
                <td className={cx('test-title')}>
                  <strong>{test.title || tTests('card.fallbackTitle')}</strong>
                </td>
                <td className={cx('test-duration')}>
                  {test.durationMinutes
                    ? tTests('minutes', {count: test.durationMinutes})
                    : tTests('unlimited')}
                </td>
                <td>
                  <Badge bg={variant} className={cx('status-badge')}>
                    {tTests(`status.${statusLabelKey}`)}
                  </Badge>
                </td>
                <td className={cx('test-participants')}>
                  {test.totalAttempts ?? 0}
                </td>
                <td>
                  <div className={cx('action-group')}>
                    {onRefresh && (
                      <OverlayTrigger overlay={<Tooltip>{t('edit')}</Tooltip>}>
                        <ButtonPrime
                          size="icon"
                          variant="ghost"
                          aria-label={t('edit')}
                          onClick={() => setEditingTest(test)}
                        >
                          <Pencil size={18} />
                        </ButtonPrime>
                      </OverlayTrigger>
                    )}

                    {onDelete && (
                      <OverlayTrigger overlay={<Tooltip>{t('delete')}</Tooltip>}>
                        <ButtonPrime
                          size="icon"
                          variant="dangerGhost"
                          aria-label={t('delete')}
                          onClick={() => onDelete(test.testId)}
                        >
                          <Trash2 size={18} />
                        </ButtonPrime>
                      </OverlayTrigger>
                    )}

                    <OverlayTrigger
                      overlay={<Tooltip>{t('viewScores')}</Tooltip>}
                    >
                      <ButtonPrime
                        size="icon"
                        variant="ghost"
                        aria-label={t('viewScores')}
                        onClick={() =>
                          router.push(buildTestPath(test, 'history'))
                        }
                      >
                        <ChartNoAxesColumnIncreasing size={18} />
                      </ButtonPrime>
                    </OverlayTrigger>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </Table>

      <EditTestModal
        show={!!editingTest}
        onHide={() => setEditingTest(null)}
        test={editingTest}
        onSuccess={() => {
          setEditingTest(null);
          if (onRefresh) onRefresh();
        }}
      />
    </div>
  );
};

export default TestManagementTable;
