import React, {useEffect, useState} from 'react';
import axios from 'axios';
import {
  Card,
  Spinner,
  Alert,
  Container,
  Row,
  Col,
  Button,
} from 'react-bootstrap';
import {useNavigate} from 'react-router-dom';
import './MyClassPage.scss';
import routes from '../../config/Routes'; // 🟢 đảm bảo import đúng đường dẫn

const MyClassesPage = () => {
  const [teachingClasses, setTeachingClasses] = useState([]);
  const [learningClasses, setLearningClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  // 🟢 Lấy danh sách lớp học (bao gồm lớp dạy + học)
  useEffect(() => {
    const fetchMyClasses = async () => {
      try {
        const res = await axios.get('/api/class-members/my-classes');

        if (res.data.message) {
          setMessage(res.data.message);
        } else {
          setTeachingClasses(res.data.teachingClasses || []);
          setLearningClasses(res.data.learningClasses || []);
        }
      } catch (err) {
        console.error('❌ Lỗi khi tải danh sách lớp học:', err);
        setMessage('❌ Lỗi khi tải danh sách lớp học!');
      } finally {
        setLoading(false);
      }
    };

    fetchMyClasses();
  }, []);

  // 🧭 Khi click vào lớp → chuyển đến danh sách bài test của lớp
  const handleViewTests = (classId) => {
    const path = routes.testClasses.replace(':classId', classId);
    navigate(path);
  };

  // 🌀 Hiển thị loading khi chưa tải xong
  if (loading) {
    return (
      <div className="my-classes-loading text-center mt-5">
        <Spinner animation="border" variant="primary" />
        <div>Đang tải danh sách lớp học...</div>
      </div>
    );
  }

  return (
    <Container className="my-classes-page mt-4">
      <h2 className="page-title text-center mb-4">🎓 Lớp học của tôi</h2>

      {/* 👨‍🏫 Lớp tôi dạy */}
      {teachingClasses.length > 0 && (
        <>
          <h4 className="section-title mt-3 mb-3">👨‍🏫 Lớp tôi dạy</h4>
          <Row>
            {teachingClasses.map((clazz) => (
              <Col md={6} lg={4} key={clazz.classId} className="mb-4">
                <Card
                  className="class-card shadow-sm"
                  onClick={() => handleViewTests(clazz.classId)}
                >
                  <Card.Body>
                    <Card.Title className="class-name">
                      {clazz.className}
                    </Card.Title>
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
                          e.stopPropagation();
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
        </>
      )}

      {/* 👨‍🎓 Lớp tôi học */}
      {learningClasses.length > 0 && (
        <>
          <h4 className="section-title mt-5 mb-3">👨‍🎓 Lớp tôi học</h4>
          <Row>
            {learningClasses.map((clazz) => (
              <Col md={6} lg={4} key={clazz.classId} className="mb-4">
                <Card
                  className="class-card shadow-sm"
                  onClick={() => handleViewTests(clazz.classId)}
                >
                  <Card.Body>
                    <Card.Title className="class-name">
                      {clazz.className}
                    </Card.Title>
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
                          e.stopPropagation();
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
        </>
      )}

      {/* Nếu không có lớp nào */}
      {teachingClasses.length === 0 && learningClasses.length === 0 && (
        <Alert variant="info" className="text-center mt-4">
          Bạn chưa có lớp học nào.
        </Alert>
      )}
    </Container>
  );
};

export default MyClassesPage;
