import React, {useEffect, useState} from 'react';
import axios from 'axios';
import {
  Card,
  Container,
  Row,
  Col,
  Spinner,
  Alert,
  Button,
  Modal,
  Form,
} from 'react-bootstrap';
import {useNavigate} from 'react-router-dom';
import './MyAlbumsPage.scss';

const MyAlbumsPage = () => {
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [newAlbum, setNewAlbum] = useState({
    name: '',
    description: '',
    coverUrl: '',
  });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAlbums = async () => {
      try {
        const res = await axios.get('/api/vocabulary-albums/my-albums');
        setAlbums(res.data);
      } catch (err) {
        console.error(err);
        setErrorMsg('Không thể tải danh sách album 😢');
      } finally {
        setLoading(false);
      }
    };
    fetchAlbums();
  }, []);

  const handleCreateAlbum = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/api/vocabulary-albums', newAlbum);
      setAlbums((prev) => [...prev, res.data]);
      setShowModal(false);
      setNewAlbum({name: '', description: '', coverUrl: ''});
    } catch (err) {
      alert('❌ Không thể tạo album mới!');
      console.error(err);
    }
  };

  if (loading)
    return (
      <div className="text-center mt-5">
        <Spinner animation="border" /> <p>Đang tải...</p>
      </div>
    );

  if (errorMsg) return <Alert variant="danger">{errorMsg}</Alert>;

  return (
    <Container className="my-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold text-primary mb-0">📚 Album từ vựng của tôi</h2>
        <Button variant="success" onClick={() => setShowModal(true)}>
          ➕ Tạo album mới
        </Button>
      </div>

      {albums.length === 0 ? (
        <Alert variant="info">Chưa có album nào được tạo.</Alert>
      ) : (
        <Row xs={1} sm={2} md={3} lg={4} className="g-4">
          {albums.map((album) => (
            <Col key={album.albumId}>
              <Card
                className="album-card shadow-sm h-100"
                onClick={() => navigate(`/albums/${album.albumId}`)}
              >
                <Card.Img
                  variant="top"
                  src={
                    album.coverUrl || 'https://placehold.co/300x200?text=Album'
                  }
                  alt={album.name}
                />
                <Card.Body>
                  <Card.Title className="fw-semibold">{album.name}</Card.Title>
                  <Card.Text className="text-muted">
                    {album.description || 'Không có mô tả'}
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {/* 🧱 Modal tạo album */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Form onSubmit={handleCreateAlbum}>
          <Modal.Header closeButton>
            <Modal.Title>Tạo album mới</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Tên album</Form.Label>
              <Form.Control
                type="text"
                value={newAlbum.name}
                onChange={(e) =>
                  setNewAlbum({...newAlbum, name: e.target.value})
                }
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Mô tả</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={newAlbum.description}
                onChange={(e) =>
                  setNewAlbum({...newAlbum, description: e.target.value})
                }
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Huỷ
            </Button>
            <Button type="submit" variant="primary">
              Tạo
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default MyAlbumsPage;
