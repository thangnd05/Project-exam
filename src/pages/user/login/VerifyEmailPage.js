import {useEffect} from 'react';
import {useSearchParams, useNavigate} from 'react-router-dom';
import axios from 'axios';

export default function VerifyEmailPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token');

  useEffect(() => {
    if (token) {
      axios
        .get(`http://localhost:8080/api/auth/verify?token=${token}`)
        .then((res) => {
          alert(res.data.message || '✅ Xác thực thành công!');
          navigate('/login'); // ✅ nếu xác thực thành công → chuyển đến trang login
        })
        .catch((err) => {
          alert(err.response?.data?.message || '❌ Xác thực thất bại!');
          navigate('/register'); // ❌ nếu thất bại → chuyển đến trang đăng ký
        });
    } else {
      alert('❌ Thiếu token xác thực!');
      navigate('/register');
    }
  }, [token, navigate]);

  return <h3>Đang xác thực tài khoản, vui lòng chờ...</h3>;
}
