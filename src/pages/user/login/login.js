import React, { useState, useContext, useEffect } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { UserContext } from "~/context/AuthContext";

function LoginPage() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const { user, login } = useContext(UserContext);
  const navigate = useNavigate();

  // Hook này sẽ tự động chuyển trang khi đăng nhập thành công
  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const response = await axios.post("/api/auth/login", {
        identifier,
        password,
      });

      // Lấy trực tiếp object 'user' từ response của backend
      const userData = response.data.user; 
      
      // Nếu có userData, cập nhật context
      if (userData) {
        login(userData);
        setMessage("Đăng nhập thành công, đang chuyển hướng...");
      } else {
        // Phòng trường hợp backend trả về response không mong muốn
        throw new Error("Dữ liệu người dùng không hợp lệ.");
      }

    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || "Đã có lỗi xảy ra ❌";
      setMessage(errorMessage);
      setLoading(false); 
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.loginBox}>
        <h2 style={styles.title}>Đăng nhập</h2>
        <form onSubmit={handleLogin}>
          {/* Input fields không thay đổi */}
          <div style={styles.inputGroup}>
            <label htmlFor="identifier" style={styles.label}>Tên đăng nhập hoặc Email</label>
            <input
              id="identifier"
              type="text"
              placeholder="Nhập username hoặc email"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
              style={styles.input}
              disabled={loading}
            />
          </div>
          <div style={styles.inputGroup}>
            <label htmlFor="password" style={styles.label}>Mật khẩu</label>
            <input
              id="password"
              type="password"
              placeholder="Nhập mật khẩu"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={styles.input}
              disabled={loading}
            />
          </div>

          {message && <p style={styles.message}>{message}</p>}

          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? 'Đang xử lý...' : 'Đăng nhập'}
          </button>
        </form>
        <p style={styles.footerText}>
          Chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link>
        </p>
      </div>
    </div>
  );
}

// Giữ nguyên phần styles
const styles = {
    container: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '80vh',
        backgroundColor: '#f4f4f8',
        padding: '20px',
    },
    loginBox: {
        padding: '40px',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        width: '100%',
        maxWidth: '400px',
    },
    title: {
        marginBottom: '24px',
        textAlign: 'center',
        color: '#333',
    },
    inputGroup: {
        marginBottom: '20px',
    },
    label: {
        display: 'block',
        marginBottom: '8px',
        fontWeight: '600',
        color: '#555',
    },
    input: {
        width: '100%',
        padding: '12px',
        border: '1px solid #ccc',
        borderRadius: '4px',
        fontSize: '16px',
    },
    button: {
        width: '100%',
        padding: '12px',
        backgroundColor: '#007bff',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        fontSize: '16px',
        cursor: 'pointer',
    },
    message: {
        textAlign: 'center',
        marginBottom: '16px',
        color: 'red',
        minHeight: '20px',
    },
    footerText: {
        marginTop: '20px',
        textAlign: 'center',
        color: '#555',
    }
};

export default LoginPage;