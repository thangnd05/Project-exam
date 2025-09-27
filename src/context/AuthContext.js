import { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // cấu hình axios mặc định
  axios.defaults.withCredentials = true;
  axios.defaults.baseURL = 'http://localhost:8080';

  // Kiểm tra session khi load app
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await axios.get('/api/auth/me');
        const userData = response.data;
        setUser({
          userId: userData.id,
          username: userData.username || userData.name || userData.email,
          email: userData.email,
          role: userData.role,
        });
        setError(null);
      } catch (err) {
        console.error('Chưa đăng nhập:', err.response?.data || err.message);
        setUser(null);
        setError('Chưa đăng nhập');
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentUser();
  }, []);

  // login
  const login = (userData) => {
    setUser({
      ...userData,
      username: userData.username || userData.name || userData.email,
    });
    setError(null);
  };

  // logout
  const logout = async () => {
    try {
      await axios.post('/api/auth/logout');
      setUser(null);
      setError(null);
    } catch (err) {
      console.error('Lỗi logout:', err.response?.data || err.message);
      setUser(null);
      setError('Lỗi khi đăng xuất');
    }
  };

  return (
    <UserContext.Provider value={{ user, loading, error, login, logout }}>
      {children}
    </UserContext.Provider>
  );
};
