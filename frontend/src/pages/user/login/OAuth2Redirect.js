import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hook/useAuth';
import axios from 'axios';

function OAuth2Redirect() {
    const navigate = useNavigate();
    const { login } = useAuth();

    useEffect(() => {
        const syncUser = async () => {
            try {
                const response = await axios.get('/api/auth/me');

                const userData = response.data;

                if (userData) {
                    login(userData);
                    navigate('/');
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