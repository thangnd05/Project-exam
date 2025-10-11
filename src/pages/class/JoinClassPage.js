import React, { useState } from "react";
import axios from "axios";
import { Button, Form, Alert } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import routes from "../../config/Routes";
import "./JoinClassPage.scss";

function JoinClassPage() {
  const [classId, setClassId] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!classId.trim()) {
      setMessage("⚠️ Vui lòng nhập mã lớp!");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const res = await axios.post("/api/class-members/join", {
        classId: Number(classId),
      });
      setMessage("✅ Gửi yêu cầu tham gia lớp thành công!");
    } catch (err) {
      setMessage("❌ Không có lớp nào với mã tham gia này!");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 🟢 Điều hướng tới trang Lớp của tôi
  const handleGoToMyClasses = () => {
    navigate(routes.myClasses);
  };

  return (
    <div className="join-class-container">
      <h4>📘 Tham gia lớp học</h4>

      {message && <Alert variant="info">{message}</Alert>}

      <Form onSubmit={handleJoin}>
        <Form.Group controlId="classId">
          <Form.Control
            type="text"
            placeholder="Nhập mã lớp..."
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
            disabled={loading}
          />
        </Form.Group>

        <div className="btn-group mt-3 d-flex justify-content-between">
          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? "Đang gửi..." : "➕ Tham gia lớp"}
          </Button>

          {/* 🟢 Nút Lớp của tôi */}
          <Button
            variant="success"
            type="button"
            onClick={handleGoToMyClasses}
          >
            🎓 Lớp của tôi
          </Button>
        </div>
      </Form>
    </div>
  );
}

export default JoinClassPage;
