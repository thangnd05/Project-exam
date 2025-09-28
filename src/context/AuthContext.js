import { createContext, useState, useEffect, useMemo } from 'react';
import axios from 'axios';

// Tạo Context
export const AuthContext = createContext(null);

// Tạo Provider Component
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true); // Trạng thái loading để biết khi nào check session xong

    // Cấu hình axios mặc định
    axios.defaults.withCredentials = true;
    axios.defaults.baseURL = 'http://localhost:8080';

    // Kiểm tra session khi ứng dụng khởi động lần đầu
    useEffect(() => {
        const fetchCurrentUser = async () => {
            try {
                const response = await axios.get('/api/auth/me');
                const userData = response.data;
                // Lưu thông tin user vào state
                setUser({
                    userId: userData.id,
                    username: userData.username || userData.name || userData.email,
                    email: userData.email,
                    role: userData.role,
                });
            } catch (err) {
                // Nếu có lỗi (thường là 401), nghĩa là chưa đăng nhập
                console.error('Session check failed: Not logged in.');
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        fetchCurrentUser();
    }, []); // Mảng rỗng đảm bảo useEffect chỉ chạy 1 lần khi component mount

    // Hàm login
    const login = (userData) => {
        // Cập nhật state với thông tin người dùng
        setUser({
            userId: userData.id || userData.userId, // Đảm bảo có userId
            username: userData.username || userData.name || userData.email,
            ...userData,
        });
    };

    // Hàm logout
    const logout = async () => {
        try {
            await axios.post('/api/auth/logout');
        } catch (err) {
            console.error('Logout API call failed:', err.response?.data || err.message);
        } finally {
            // Luôn xóa thông tin người dùng ở client dù API có lỗi hay không
            setUser(null);
        }
    };

    // Dùng useMemo để tối ưu, tránh re-render không cần thiết
    const value = useMemo(
        () => ({
            user,
            loading,
            login,
            logout,
            userId: user?.userId,
            isAuthenticated: !!user,
        }),
        [user, loading] // Chỉ tạo lại object value khi user hoặc loading thay đổi
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};