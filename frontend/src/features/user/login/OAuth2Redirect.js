import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '~/shared/hooks/useAuth';
import { getCurrentUser } from '~/shared/api/authApi';
import { claimGuestAfterLogin, takeOAuthRedirect } from '~/shared/utils/authRedirect';

function OAuth2Redirect() {
    const navigate = useNavigate();
    const { login } = useAuth();

    useEffect(() => {
        const syncUser = async () => {
            try {
                const userData = await getCurrentUser();

                if (userData) {

                    await claimGuestAfterLogin();
                    login(userData);

                    navigate(takeOAuthRedirect('/'), { replace: true });
                }
            } catch (error) {
                console.error("Lỗi đồng bộ tài khoản:", error);
                navigate('/login?error=oauth2_failed');
            }
        };

        syncUser();
    }, [login, navigate]);

    return (
        <div className="flex justify-center items-center h-screen">
            <div className="text-center">
                <p className="text-lg">Đang hoàn tất đăng nhập...</p>

            </div>
        </div>
    );
}

export default OAuth2Redirect;
