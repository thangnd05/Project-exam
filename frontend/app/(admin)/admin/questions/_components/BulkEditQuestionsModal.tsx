'use client';

import { useEffect, useState } from 'react';
import classNames from 'classnames/bind';
import { Save } from 'lucide-react';

import BaseModal from '@/app/components/modal/BaseModal';
import ModalActionFooter from '@/app/components/modal/ModalActionFooter';
import { buildCollectionTree } from '@/app/utils/collectionTree';
import { QuestionUsageScope } from '@/app/enums';
import type { BulkUpdateQuestionsRequest, QuestionCollectionResponse } from '@/app/types';

import styles from '../QuestionsManagement.module.scss';

const cx = classNames.bind(styles);

/** Giá trị select "để nguyên" - phân biệt với chuỗi rỗng của option thật. */
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
  const [usageScope, setUsageScope] = useState<string>(KEEP);
  const [collectionChoice, setCollectionChoice] = useState<string>(KEEP);
  const [bankChoice, setBankChoice] = useState<string>(KEEP);

  // Mỗi lần mở lại phải về "để nguyên", nếu không lần sửa trước còn dính lại
  // và admin bấm Lưu là ghi đè nhầm cả lô mới.
  useEffect(() => {
    if (show) {
      setUsageScope(KEEP);
      setCollectionChoice(KEEP);
      setBankChoice(KEEP);
    }
  }, [show]);

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
      title="Sửa hàng loạt"
      maxWidth={560}
      footer={
        <ModalActionFooter
          onCancel={onClose}
          onSubmit={handleSubmit}
          submitLabel={hasChange ? `Áp dụng cho ${selectedCount} câu` : 'Chưa chọn gì để sửa'}
          loadingLabel="Đang lưu..."
          loading={saving || !hasChange}
          submitIcon={Save}
        />
      }
    >
      <div className={cx('bulkForm')}>
        <p className={cx('bulkIntro')}>
          Đang chọn <strong>{selectedCount}</strong> câu. Trường nào để{' '}
          <em>Giữ nguyên</em> thì không bị đụng tới. Nội dung câu, đáp án và đoạn văn
          phải sửa từng câu.
        </p>

        <div className={cx('bulkField')}>
          <label>Mục đích sử dụng</label>
          <select
            className={cx('bulkInput')}
            value={usageScope}
            onChange={(e) => setUsageScope(e.target.value)}
          >
            <option value={KEEP}>-- Giữ nguyên --</option>
            <option value={QuestionUsageScope.EXAM}>Câu thi (ra đề)</option>
            <option value={QuestionUsageScope.PRACTICE}>Câu ôn tập (lộ trình)</option>
          </select>
        </div>

        <div className={cx('bulkField')}>
          <label>Bộ sưu tập</label>
          <select
            className={cx('bulkInput')}
            value={collectionChoice}
            onChange={(e) => setCollectionChoice(e.target.value)}
          >
            <option value={KEEP}>-- Giữ nguyên --</option>
            <option value={CLEAR_COLLECTION}>Gỡ khỏi bộ sưu tập</option>
            {buildCollectionTree(collections).map((c) => (
              <option key={c.collectionId} value={c.collectionId}>
                {c.depth > 0 ? `    └ ${c.name}` : c.name}
              </option>
            ))}
          </select>
        </div>

        <div className={cx('bulkField')}>
          <label>Thuộc kho tái dùng</label>
          <select
            className={cx('bulkInput')}
            value={bankChoice}
            onChange={(e) => setBankChoice(e.target.value)}
          >
            <option value={KEEP}>-- Giữ nguyên --</option>
            <option value="true">Có - dùng lại được khi ra đề</option>
            <option value="false">Không - chỉ thuộc đề đã gắn</option>
          </select>
        </div>

        {errorMessage && <div className={cx('bulkError')}>{errorMessage}</div>}
      </div>
    </BaseModal>
  );
}

export default BulkEditQuestionsModal;
