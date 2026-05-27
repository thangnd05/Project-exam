import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { verifyEmail } from '../../../api/authApi';

export default function VerifyEmailPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get("token");

  const [status, setStatus] = useState("loading");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMsg(" Thiếu token xác thực!");
      return;
    }

    verifyEmail(token)
      .then((data) => {
        setStatus("success");
        setMsg(data.message || " Xác thực thành công!");

        setTimeout(() => {
          navigate("/login");
        }, 2000);
      })
      .catch((err) => {
        setStatus("error");
        setMsg(err.response?.data?.message || " Xác thực thất bại!");

        setTimeout(() => {
          navigate("/register");
        }, 2500);
      });
  }, [token, navigate]);

  return (
    <div style={{ textAlign: "center", marginTop: "100px" }}>
      {status === "loading" && <h2>⏳ Đang xác thực tài khoản...</h2>}
      {status === "success" && <h2 style={{ color: "green" }}>{msg}</h2>}
      {status === "error" && <h2 style={{ color: "red" }}>{msg}</h2>}

      <p>Vui lòng chờ trong giây lát...</p>
    </div>
  );
}
