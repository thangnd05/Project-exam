'use client';

import { useEffect, useState } from 'react';
import { useRouter } from '@/app/i18n/navigation';
import { toast } from 'react-toastify';
import classNames from 'classnames/bind';
import { useTranslations } from 'next-intl';

import BaseModal from '@/app/components/modal/BaseModal';
import { buildLoginUrl } from '@/app/utils/redirect';
import { clearGuestSessionId, setGuestClaimIntent } from '@/app/utils/guestSession';
import { buildGeneratePlanUrl, buildTargetUrl } from '@/app/[locale]/(guest)/attempts/[userTestId]/_lib/planFromTest';
import promptStyles from './GuestSaveBanner.module.scss';

const px = classNames.bind(promptStyles);

const PROMPT_DELAY_MS = 1200;

type GuestSaveBannerProps = {
  userTestId?: string;
  examTypeId?: string;
};

function GuestSaveBanner({ userTestId, examTypeId }: GuestSaveBannerProps) {
  const router = useRouter();
  const t = useTranslations('TestTaking.guestSave');
  const [promptOpen, setPromptOpen] = useState(false);

  // Cho khách nhìn thấy điểm trước rồi mới hỏi. Khách bắt buộc phải chọn lưu hoặc thoát,
  // nên mỗi lần vào trang (kể cả F5) đều hỏi lại.
  useEffect(() => {
    if (!userTestId) return undefined;
    const timer = window.setTimeout(() => setPromptOpen(true), PROMPT_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [userTestId]);

  if (!userTestId) return null;

  // Đăng nhập xong bài khách được gắn vào tài khoản (claimGuestAfterLogin),
  // rồi đi tiếp đặt mục tiêu → sinh lộ trình từ đúng bài vừa làm.
  const handleSave = () => {
    const next = examTypeId
      ? buildTargetUrl(examTypeId, buildGeneratePlanUrl(userTestId, examTypeId))
      : `/attempts/${userTestId}`;
    setGuestClaimIntent(userTestId);
    router.push(buildLoginUrl(next, {
      flash: t('loginFlash'),
    }));
  };

  // Lựa chọn Thoát đã ghi rõ kết quả sẽ bị xóa nên xóa luôn, không hỏi lại lần hai.
  // Chỉ bỏ mã phiên khách trên trình duyệt: khách không xem hay nhận lại bài này được nữa,
  // còn bản ghi khách vẫn nằm trong database (userId = null).
  const handleDiscard = () => {
    clearGuestSessionId();
    setPromptOpen(false);
    toast.info(t('discarded'));
    router.replace('/');
  };

  return (
    <>
      <BaseModal
        show={promptOpen}
        title={t('title')}
        maxWidth={520}
        closeOnOverlay={false}
        closeOnEsc={false}
        showCloseButton={false}
      >
        <div className={px('body')}>
          <p className={px('lead')}>
            {t('lead')}
          </p>

          <div className={px('options')}>
            <button type="button" className={px('option')} onClick={handleSave}>
              <span className={px('optionText')}>
                <span className={px('optionTitle')}>{t('saveTitle')}</span>
                <span className={px('optionHint')}>
                  {t('saveHint')}
                </span>
              </span>
            </button>

            <button type="button" className={px('option', 'optionDanger')} onClick={handleDiscard}>
              <span className={px('optionText')}>
                <span className={px('optionTitle')}>{t('exitTitle')}</span>
                <span className={px('optionHint')}>
                  {t('exitHint')}
                </span>
              </span>
            </button>
          </div>
        </div>
      </BaseModal>
    </>
  );
}

export default GuestSaveBanner;
