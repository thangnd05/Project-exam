// File: src/hooks/useAuth.js

import { useContext } from 'react';
import { UserContext } from '~/context/AuthContext';

export const useAuth = () => {
  const context = useContext(UserContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within a UserProvider');
  }

  // Lấy ra object user từ context
const { user } = context;

  // Trả về một object đã được "xử lý sẵn" và thêm các giá trị tiện ích
  return {
  ...context,
  userId: user?.userId,   // sửa từ user?.id thành user?.userId
  username: user?.username,
  isAuthenticated: !!user,
};

};