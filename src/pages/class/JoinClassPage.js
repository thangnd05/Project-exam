import React, { useState } from "react";
import axios from "axios";

function JoinClassPage() {
  const [classId, setClassId] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

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
      setClassId("");

    } catch (err) {
      const errorMsg =
        err.response?.data?.error || "❌ Lỗi khi gửi yêu cầu vào lớp!";
      setMessage(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="container d-flex justify-content-center align-items-center"
    >
      <div
        className="card shadow p-4"
        style={{ maxWidth: "400px", width: "100%" }}
      >
        <h3 className="text-center mb-4">📘 Tham gia lớp học</h3>
        <form onSubmit={handleJoin}>
          <div className="mb-3">
            <label htmlFor="classId" className="form-label">
              Mã lớp:
            </label>
            <input
              id="classId"
              type="number"
              className="form-control"
              placeholder="Nhập mã lớp học..."
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary w-100"
            disabled={loading}
          >
            {loading ? "Đang gửi..." : "Gửi yêu cầu"}
          </button>
        </form>

        {message && (
          <p className="mt-3 text-center" style={{ color: "#d9534f" }}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
}

export default JoinClassPage;
