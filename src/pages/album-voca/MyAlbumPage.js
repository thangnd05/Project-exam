import React, { useEffect, useState } from "react";
import axios from "axios";
import { Card, Container, Row, Col, Spinner, Alert } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import "./MyAlbumsPage.scss";

const MyAlbumsPage = () => {
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAlbums = async () => {
      try {
        const res = await axios.get("/api/vocabulary-albums/my-albums");
        setAlbums(res.data);
      } catch (err) {
        console.error(err);
        setErrorMsg("Không thể tải danh sách album 😢");
      } finally {
        setLoading(false);
      }
    };
    fetchAlbums();
  }, []);

  if (loading)
    return (
      <div className="text-center mt-5">
        <Spinner animation="border" /> <p>Đang tải...</p>
      </div>
    );

  if (errorMsg) return <Alert variant="danger">{errorMsg}</Alert>;

  return (
    <Container className="my-5">
      <h2 className="mb-4 fw-bold text-primary">📚 Album từ vựng của tôi</h2>
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
                  src={album.coverUrl || "https://placehold.co/300x200?text=Album"}
                  alt={album.name}
                />
                <Card.Body>
                  <Card.Title className="fw-semibold">{album.name}</Card.Title>
                  <Card.Text className="text-muted">
                    {album.description || "Không có mô tả"}
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </Container>
  );
};

export default MyAlbumsPage;
