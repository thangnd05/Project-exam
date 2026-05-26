import {useContext} from 'react';
import {AuthContext} from '~/context/AuthContext'; // Đảm bảo đường dẫn này đúng

export const useAuth = () => {
  const context = useContext(AuthContext);

  // Nếu hook được dùng bên ngoài AuthProvider, báo lỗi ngay
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};
