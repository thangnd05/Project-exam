import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Card,
  Spinner,
  Alert,
  Container,
  Row,
  Col,
  Button,
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import "./MyClassPage.scss";
import routes from "../../config/Routes"; // 🟢 đảm bảo import đúng đường dẫn

const MyClassesPage = () => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  // 🟢 Lấy danh sách lớp học mà học sinh đã tham gia
  useEffect(() => {
    const fetchMyClasses = async () => {
      try {
        const res = await axios.get("/api/class-members/my-classes"); // Cookie JWT tự động gửi
        if (Array.isArray(res.data)) {
          setClasses(res.data);
        } else if (res.data.message) {
          setMessage(res.data.message);
        }
      } catch (err) {
        console.error("❌ Lỗi khi tải danh sách lớp học:", err);
        setMessage("❌ Lỗi khi tải danh sách lớp học!");
      } finally {
        setLoading(false);
      }
    };

    fetchMyClasses();
  }, []);

  // 🧭 Khi click vào lớp → chuyển đến danh sách bài test của lớp
  const handleViewTests = (classId) => {
    const path = routes.testClasses.replace(":classId", classId);
    navigate(path);
  };

  // 🌀 Hiển thị loading khi chưa tải xong
  if (loading) {
    return (
      <div className="my-classes-loading">
        <Spinner animation="border" variant="primary" />
        <span> Đang tải danh sách lớp học...</span>
      </div>
    );
  }

  // 🧩 Hiển thị danh sách lớp
  return (
    <Container className="my-classes-page">
      <h2 className="page-title">🎓 Lớp học của tôi</h2>

      {message && <Alert variant="info">{message}</Alert>}

      <Row>
        {classes.map((clazz) => (
          <Col md={6} lg={4} key={clazz.classId} className="mb-4">
            <Card
              className="class-card shadow-sm"
              onClick={() => handleViewTests(clazz.classId)}
            >
              <Card.Body>
                <Card.Title className="class-name">{clazz.className}</Card.Title>
                <Card.Subtitle className="mb-2 text-muted">
                  👨‍🏫 Giáo viên: {clazz.teacherName}
                </Card.Subtitle>
                <Card.Text>
                  <small>Mã lớp: {clazz.classId}</small>
                </Card.Text>
                <div className="d-flex justify-content-end">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation(); // tránh trùng click với Card
                      handleViewTests(clazz.classId);
                    }}
                  >
                    📘 Xem bài kiểm tra
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </Container>
  );
};

export default MyClassesPage;
