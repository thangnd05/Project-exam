import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hook/useAuth'; // Đường dẫn tới hook của bạn
import axios from 'axios';

function OAuth2Redirect() {
    const navigate = useNavigate();
    const { login } = useAuth(); // Hàm login này sẽ set user vào State/Context

    useEffect(() => {
        const syncUser = async () => {
            try {
                // 1. Gọi API /me mà bạn vừa cho mình xem
                const response = await axios.get('/api/auth/me');

                // 2. Lấy dữ liệu user (id, username, email, role...)
                const userData = response.data;

                if (userData) {
                    // 3. Cập nhật vào Context (để Header có thể thấy user.username)
                    login(userData);

                    // 4. Về trang chủ
                    navigate('/');
                }
            } catch (error) {
                console.error("Không thể lấy thông tin user Google:", error);
                navigate('/login');
            }
        };

        syncUser();
    }, [login, navigate]);

    return (
        <div className="flex justify-center items-center h-screen">
            <p>Đang đồng bộ tài khoản Google...</p>
        </div>
    );
}

export default OAuth2Redirect;