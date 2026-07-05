import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { getCurrentUser } from '../../../api/authApi';
import { claimGuestAfterLogin, takeOAuthRedirect } from '~/utils/authRedirect';

function OAuth2Redirect() {
    const navigate = useNavigate();
    const { login } = useAuth();

    useEffect(() => {
        const syncUser = async () => {
            try {
                const userData = await getCurrentUser();

                if (userData) {
                    // Gắn bài làm dạng khách (nếu có) vào tài khoản vừa đăng nhập.
                    await claimGuestAfterLogin();
                    login(userData);
                    // Quay lại đúng trang trước khi đăng nhập (đã lưu trước khi rời trang).
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
                {/* Bạn có thể thêm một cái Spinner/Loading ở đây */}
            </div>
        </div>
    );
}

export default OAuth2Redirect;