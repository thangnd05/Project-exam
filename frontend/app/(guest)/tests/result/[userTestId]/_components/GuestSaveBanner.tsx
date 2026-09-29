'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import classNames from 'classnames/bind';
import { BookmarkCheck } from 'lucide-react';
import { IoArrowForward, IoExitOutline, IoTrashOutline } from 'react-icons/io5';

import ButtonPrime from '@/app/components/Button/ButtonPrime';
import BaseModal from '@/app/components/modal/BaseModal';
import ConfirmModal from '@/app/components/modal/ConfirmModal';
import { buildLoginUrl } from '@/app/utils/authRedirect';
import { clearGuestSessionId } from '@/app/utils/guestSession';
import { buildGeneratePlanUrl, buildTargetUrl } from '@/app/utils/planFromTest';
import styles from './CertificateBanner.module.scss';
import promptStyles from './GuestSaveBanner.module.scss';

const cx = classNames.bind(styles);
const px = classNames.bind(promptStyles);

const PROMPT_SEEN_KEY = 'guestResultPromptSeen';
const PROMPT_DELAY_MS = 1200;

// Mỗi bài chỉ tự hỏi một lần trong phiên, quay lại từ trang đáp án không bị hỏi lại.
const hasSeenPrompt = (userTestId: string): boolean => {
  try {
    return window.sessionStorage.getItem(`${PROMPT_SEEN_KEY}:${userTestId}`) === '1';
  } catch {
    return false;
  }
};

const markPromptSeen = (userTestId: string): void => {
  try {
    window.sessionStorage.setItem(`${PROMPT_SEEN_KEY}:${userTestId}`, '1');
  } catch {
    // Không lưu được thì lần sau hỏi lại, không sao.
  }
};

type GuestSaveBannerProps = {
  userTestId?: string;
  examTypeId?: string;
};

function GuestSaveBanner({ userTestId, examTypeId }: GuestSaveBannerProps) {
  const router = useRouter();
  const [promptOpen, setPromptOpen] = useState(false);
  const [confirmExit, setConfirmExit] = useState(false);

  // Cho khách nhìn thấy điểm trước rồi mới hỏi.
  useEffect(() => {
    if (!userTestId || hasSeenPrompt(userTestId)) return undefined;
    const timer = window.setTimeout(() => {
      markPromptSeen(userTestId);
      setPromptOpen(true);
    }, PROMPT_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [userTestId]);

  if (!userTestId) return null;

  // Đăng nhập xong bài khách được gắn vào tài khoản (claimGuestAfterLogin),
  // rồi đi tiếp đặt mục tiêu → sinh lộ trình từ đúng bài vừa làm.
  const handleSave = () => {
    const next = examTypeId
      ? buildTargetUrl(examTypeId, buildGeneratePlanUrl(userTestId, examTypeId))
      : `/tests/result/${userTestId}`;
    router.push(buildLoginUrl(next, {
      flash: 'Đăng nhập để lưu kết quả và xây lộ trình cá nhân hóa.',
    }));
  };

  const openExitConfirm = () => {
    setPromptOpen(false);
    setConfirmExit(true);
  };

  // Chỉ bỏ mã phiên khách trên trình duyệt: khách không xem hay nhận lại bài này được nữa,
  // còn bản ghi khách vẫn nằm trong database (userId = null).
  const handleDiscard = () => {
    clearGuestSessionId();
    setConfirmExit(false);
    toast.info('Đã xóa kết quả bài làm của bạn.');
    router.replace('/');
  };

  return (
    <>
      <div className={cx('banner', 'pending')}>
        <BookmarkCheck size={28} className={cx('icon')} />
        <div className={cx('content')}>
          <h3 className={cx('title')}>Lưu kết quả này và xây lộ trình cá nhân hóa?</h3>
          <p className={cx('desc')}>
            Đăng nhập để lưu bài vừa làm vào tài khoản, WinDe sẽ chẩn đoán điểm yếu và lập lộ
            trình ôn tập cho bạn. Nếu thoát, kết quả này sẽ bị xóa.
          </p>
        </div>
        <div className={px('bannerActions')}>
          <ButtonPrime variant="ghost" onClick={openExitConfirm}>
            Thoát
          </ButtonPrime>
          <ButtonPrime variant="primary" onClick={handleSave}>
            Đăng nhập & lưu
          </ButtonPrime>
        </div>
      </div>

      <BaseModal
        show={promptOpen}
        onClose={() => setPromptOpen(false)}
        title="Bạn đã có kết quả!"
        maxWidth={520}
      >
        <div className={px('body')}>
          <p className={px('lead')}>
            Bạn có muốn lưu kết quả này và xây lộ trình cá nhân hóa không?
          </p>

          <div className={px('options')}>
            <button type="button" className={px('option')} onClick={handleSave}>
              <span className={px('optionIcon')}>
                <BookmarkCheck size={20} aria-hidden="true" />
              </span>
              <span className={px('optionText')}>
                <span className={px('optionTitle')}>Đăng nhập & lưu kết quả</span>
                <span className={px('optionHint')}>
                  Bài vừa làm được lưu vào tài khoản và dùng để lập lộ trình ôn tập.
                </span>
              </span>
              <IoArrowForward className={px('optionArrow')} aria-hidden="true" />
            </button>

            <button type="button" className={px('option', 'optionDanger')} onClick={openExitConfirm}>
              <span className={px('optionIcon')}>
                <IoExitOutline aria-hidden="true" />
              </span>
              <span className={px('optionText')}>
                <span className={px('optionTitle')}>Thoát</span>
                <span className={px('optionHint')}>
                  Kết quả của bạn sẽ bị xóa vĩnh viễn.
                </span>
              </span>
              <IoArrowForward className={px('optionArrow')} aria-hidden="true" />
            </button>
          </div>

          <button type="button" className={px('later')} onClick={() => setPromptOpen(false)}>
            Xem kết quả trước
          </button>
        </div>
      </BaseModal>

      <ConfirmModal
        show={confirmExit}
        onClose={() => setConfirmExit(false)}
        onConfirm={handleDiscard}
        title="Xóa kết quả và thoát?"
        message="Kết quả bài làm này sẽ bị xóa vĩnh viễn, bạn không thể xem lại hay lưu vào tài khoản sau này."
        icon={IoTrashOutline}
        variant="danger"
        confirmText="Xóa & thoát"
        cancelText="Giữ lại"
      />
    </>
  );
}

export default GuestSaveBanner;
