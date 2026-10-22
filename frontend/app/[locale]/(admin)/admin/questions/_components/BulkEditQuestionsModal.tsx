'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import classNames from 'classnames/bind';
import { Save } from 'lucide-react';

import BaseModal from '@/app/components/modal/BaseModal';
import ModalActionFooter from '@/app/components/modal/ModalActionFooter';
import { buildCollectionTree } from '@/app/features/tests/collectionTree';
import { QuestionUsageScope } from '@/app/enums';
import type { BulkUpdateQuestionsRequest, QuestionCollectionResponse } from '@/app/types';

import styles from '@/app/[locale]/(admin)/admin/questions/QuestionsManagement.module.scss';

const cx = classNames.bind(styles);

const KEEP = '';
const CLEAR_COLLECTION = '__CLEAR__';

export type BulkEditQuestionsModalProps = {
  show: boolean;
  onClose: () => void;
  selectedCount: number;
  collections: QuestionCollectionResponse[];
  saving?: boolean;
  errorMessage?: string;
  onSubmit: (payload: Omit<BulkUpdateQuestionsRequest, 'questionIds'>) => void;
};

function BulkEditQuestionsModal({
  show,
  onClose,
  selectedCount,
  collections,
  saving = false,
  errorMessage,
  onSubmit,
}: BulkEditQuestionsModalProps) {
  const t = useTranslations('AdminContent.questions.bulk');
  const [usageScope, setUsageScope] = useState<string>(KEEP);
  const [collectionChoice, setCollectionChoice] = useState<string>(KEEP);
  const [bankChoice, setBankChoice] = useState<string>(KEEP);

  // Đặt lại lựa chọn mỗi khi mở modal
  const [prevShow, setPrevShow] = useState(false);
  if (show !== prevShow) {
    setPrevShow(show);
    if (show) {
      setUsageScope(KEEP);
      setCollectionChoice(KEEP);
      setBankChoice(KEEP);
    }
  }

  const hasChange =
    usageScope !== KEEP || collectionChoice !== KEEP || bankChoice !== KEEP;

  const handleSubmit = () => {
    if (!hasChange) return;
    onSubmit({
      usageScope: usageScope === KEEP ? null : (usageScope as QuestionUsageScope),
      clearCollection: collectionChoice === CLEAR_COLLECTION,
      collectionId:
        collectionChoice === KEEP || collectionChoice === CLEAR_COLLECTION
          ? null
          : collectionChoice,
      isBank: bankChoice === KEEP ? null : bankChoice === 'true',
    });
  };

  return (
    <BaseModal
      show={show}
      onClose={saving ? undefined : onClose}
      title={t('title')}
      maxWidth={560}
      footer={
        <ModalActionFooter
          onCancel={onClose}
          onSubmit={handleSubmit}
          submitLabel={hasChange ? t('apply', { count: selectedCount }) : t('noChange')}
          loadingLabel={t('saving')}
          loading={saving || !hasChange}
          submitIcon={Save}
        />
      }
    >
      <div className={cx('bulkForm')}>
        <p className={cx('bulkIntro')}>
          {t.rich('intro', {
            count: selectedCount,
            strong: (chunks) => <strong>{chunks}</strong>,
            em: (chunks) => <em>{chunks}</em>,
          })}
        </p>

        <div className={cx('bulkField')}>
          <label>{t('usageScope')}</label>
          <select
            className={cx('bulkInput')}
            value={usageScope}
            onChange={(e) => setUsageScope(e.target.value)}
          >
            <option value={KEEP}>{t('keep')}</option>
            <option value={QuestionUsageScope.EXAM}>{t('scopeExam')}</option>
            <option value={QuestionUsageScope.PRACTICE}>{t('scopePractice')}</option>
          </select>
        </div>

        <div className={cx('bulkField')}>
          <label>{t('collection')}</label>
          <select
            className={cx('bulkInput')}
            value={collectionChoice}
            onChange={(e) => setCollectionChoice(e.target.value)}
          >
            <option value={KEEP}>{t('keep')}</option>
            <option value={CLEAR_COLLECTION}>{t('clearCollection')}</option>
            {buildCollectionTree(collections).map((c) => (
              <option key={c.collectionId} value={c.collectionId}>
                {c.depth > 0 ? `    └ ${c.name}` : c.name}
              </option>
            ))}
          </select>
        </div>

        <div className={cx('bulkField')}>
          <label>{t('bank')}</label>
          <select
            className={cx('bulkInput')}
            value={bankChoice}
            onChange={(e) => setBankChoice(e.target.value)}
          >
            <option value={KEEP}>{t('keep')}</option>
            <option value="true">{t('bankYes')}</option>
            <option value="false">{t('bankNo')}</option>
          </select>
        </div>

        {errorMessage && <div className={cx('bulkError')}>{errorMessage}</div>}
      </div>
    </BaseModal>
  );
}

export default BulkEditQuestionsModal;
