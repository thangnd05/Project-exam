import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Modal, Form, Spinner, Button, Container } from 'react-bootstrap';
import classNames from 'classnames/bind';
import { IoAddCircleOutline, IoFolderOpenOutline, IoArrowForwardOutline, IoInformationCircleOutline } from "react-icons/io5";
import { FaBookOpen } from "react-icons/fa";

import styles from './MyAlbumPage.module.scss';

const cx = classNames.bind(styles);

function MyAlbumsPage() {
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

  // 🟢 Lấy danh sách album
  useEffect(() => {
    const fetchAlbums = async () => {
      try {
        const res = await axios.get('/api/vocabulary-albums/my-albums');
        setAlbums(res.data || []);
      } catch (err) {
        console.error(err);
        setErrorMsg('Không thể tải danh sách album 😢');
      } finally {
        setLoading(false);
      }
    };
    fetchAlbums();
  }, []);

  // 🟢 Tạo album mới
  const handleCreateAlbum = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/api/vocabulary-albums', newAlbum);
      setAlbums((prev) => [...prev, res.data]);
      setShowModal(false);
      setNewAlbum({ name: '', description: '', coverUrl: '' });
    } catch (err) {
      alert('❌ Không thể tạo album mới!');
      console.error(err);
    }
  };

  if (loading)
    return (
      <div className="d-flex flex-column justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <Spinner animation="grow" variant="primary" size="lg" />
        <p className="mt-3 fw-bold text-primary fs-4">Đang chuẩn bị kho tàng từ vựng...</p>
      </div>
    );

  return (
    <div className={cx('wrapper')}>
      <Container>
        {/* === Header Dashboard === */}
        <div className={cx('header')}>
          <div className={cx('title-section')}>
            <h1 className={cx('page-title')}>Album từ vựng</h1>
            <p className={cx('page-subtitle')}>Lưu trữ và quản lý hành trình chinh phục ngôn ngữ của bạn</p>
          </div>
          <button className={cx('btn-create')} onClick={() => setShowModal(true)}>
            <IoAddCircleOutline />
            Tạo album mới
          </button>
        </div>

        {/* === Body Content === */}
        {albums.length === 0 ? (
          <div className={cx('empty-state')}>
            <div className={cx('empty-icon')}>
              <IoFolderOpenOutline />
            </div>
            <h4>Chưa có album nào</h4>
            <p>Bắt đầu tạo album đầu tiên để lưu lại các từ vựng thú vị nhé!</p>
            <button className={cx('btn-create-empty')} onClick={() => setShowModal(true)}>
              <IoAddCircleOutline />
              Tạo album ngay
            </button>
          </div>
        ) : (
          <div className={cx('album-grid')}>
            {albums.map((album) => (
              <div
                key={album.albumId}
                className={cx('album-card')}
                onClick={() => navigate(`/albums/${album.albumId}`)}
              >
                <div className={cx('cover-wrapper')}>
                  <img
                    src={
                      album.coverUrl ||
                      'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=1000&auto=format&fit=crop'
                    }
                    alt={album.name}
                    className={cx('album-cover')}
                  />
                </div>
                <div className={cx('album-body')}>
                  <h5>{album.name}</h5>
                  <p>{album.description || 'Hành trình chinh phục từ vựng tiếng Anh mỗi ngày cùng WinDe.'}</p>

                  <div className={cx('album-footer')}>
                    <div className={cx('view-link')}>
                      <FaBookOpen />
                      Xem chi tiết
                    </div>
                    <IoArrowForwardOutline />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Container>

      {/* === Modal tạo album Refined === */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg">
        <Form onSubmit={handleCreateAlbum}>
          <Modal.Header closeButton>
            <Modal.Title>
              <IoAddCircleOutline className="me-2" />
              Khởi tạo Album mới
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form.Group className="mb-4">
              <Form.Label>Tên Album của bạn</Form.Label>
              <Form.Control
                type="text"
                placeholder="VD: Từ vựng IELTS 7.0, Giao tiếp hàng ngày..."
                value={newAlbum.name}
                onChange={(e) =>
                  setNewAlbum({ ...newAlbum, name: e.target.value })
                }
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Mô tả ngắn gọn</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                placeholder="Ghi chú thêm về mục tiêu của album này..."
                value={newAlbum.description}
                onChange={(e) =>
                  setNewAlbum({ ...newAlbum, description: e.target.value })
                }
              />
            </Form.Group>
            <div className="d-flex align-items-center text-muted small mt-2">
              <IoInformationCircleOutline className="me-1" />
              Bạn có thể thay đổi thông tin này bất cứ lúc nào.
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="light" onClick={() => setShowModal(false)} className="px-4">
              Để sau
            </Button>
            <Button type="submit" variant="primary" className="px-5 shadow-sm">
              Tạo Album
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
}

export default MyAlbumsPage;
