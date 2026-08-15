'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '~/shared/hooks/useAuth';
import { fetchCurrentUser } from '~/features/user/login/hooks/useAuthActions';
import { claimGuestAfterLogin, takeOAuthRedirect } from '~/shared/utils/authRedirect';

function OAuth2Redirect() {
    const router = useRouter();
    const { login } = useAuth();

    useEffect(() => {
        const syncUser = async () => {
            try {
                const userData = await fetchCurrentUser();

                if (userData) {

                    await claimGuestAfterLogin();
                    login(userData);

                    router.replace(takeOAuthRedirect('/'));
                }
            } catch (error) {
                console.error("Lỗi đồng bộ tài khoản:", error);
                router.push('/login?error=oauth2_failed');
            }
        };

        syncUser();
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
