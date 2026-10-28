'use client';

import { useRouter } from '@/app/i18n/navigation';
import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/app/hooks/useAuth';
import { fetchCurrentUser } from '@/app/features/auth/hooks/useAuthActions';
import { claimGuestAfterLogin } from '@/app/features/auth/claimGuest';
import { takeOAuthRedirect } from '@/app/utils/redirect';
import { localizeHref, splitLocale } from '@/app/i18n/routing';

// Quá thời gian này mà chưa lấy được tài khoản thì trả về trang đăng nhập, không để người dùng đứng chờ mãi.
const SYNC_TIMEOUT_MS = 15000;

function OAuth2Redirect() {
    const t = useTranslations('Auth');
    const router = useRouter();
    const { login } = useAuth();

    useEffect(() => {
        let finished = false;

        const fail = (error: 'oauth2_failed' | 'oauth2_timeout') => {
            if (finished) return;
            finished = true;
            // Backend trả về /oauth2/redirect không tiền tố, nên lấy ngôn ngữ từ trang đã lưu trước khi đi OAuth.
            const { locale } = splitLocale(takeOAuthRedirect('/'));
            router.replace(localizeHref(`/login?error=${error}`, locale));
        };

        // Backend báo đăng nhập OAuth thất bại cũng trả về đây (?error=) để quay lại trang đăng nhập đúng ngôn ngữ.
        // Hẹn sang lượt sau để StrictMode chạy effect hai lần cũng chỉ lấy đích đã lưu một lần.
        if (new URLSearchParams(window.location.search).has('error')) {
            const errorTimer = setTimeout(() => fail('oauth2_failed'), 0);
            return () => {
                finished = true;
                clearTimeout(errorTimer);
            };
        }

        const timeoutId = setTimeout(() => fail('oauth2_timeout'), SYNC_TIMEOUT_MS);

        const syncUser = async () => {
            try {
                const userData = await fetchCurrentUser();
                if (finished) return;

                if (!userData?.id) {
                    fail('oauth2_failed');
                    return;
                }

                await claimGuestAfterLogin();
                if (finished) return;
                finished = true;
                login(userData);

                router.replace(takeOAuthRedirect('/'));
            } catch (error) {
                console.error("Lỗi đồng bộ tài khoản:", error);
                fail('oauth2_failed');
            } finally {
                clearTimeout(timeoutId);
            }
        };

        syncUser();

        return () => {
            finished = true;
            clearTimeout(timeoutId);
        };
    }, [login, router]);

    return (
        <div className="flex justify-center items-center h-screen">
            <div className="text-center">
                <p className="text-lg">{t('oauth.completing')}</p>

            </div>
        </div>
    );
}

export default OAuth2Redirect;
