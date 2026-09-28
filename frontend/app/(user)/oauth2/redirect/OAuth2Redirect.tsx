'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/app/hooks/useAuth';
import { fetchCurrentUser } from '@/app/hooks/useAuthActions';
import { claimGuestAfterLogin, takeOAuthRedirect } from '@/app/utils/authRedirect';

// Quá thời gian này mà chưa lấy được tài khoản thì trả về trang đăng nhập, không để người dùng đứng chờ mãi.
const SYNC_TIMEOUT_MS = 15000;

function OAuth2Redirect() {
    const router = useRouter();
    const { login } = useAuth();

    useEffect(() => {
        let finished = false;

        const fail = (error: 'oauth2_failed' | 'oauth2_timeout') => {
            if (finished) return;
            finished = true;
            router.replace(`/login?error=${error}`);
        };

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
                <p className="text-lg">Đang hoàn tất đăng nhập...</p>

            </div>
        </div>
    );
}

export default OAuth2Redirect;
