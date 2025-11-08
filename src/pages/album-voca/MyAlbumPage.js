import React, {useEffect, useState} from 'react';
import axios from 'axios';
import {useNavigate} from 'react-router-dom';
import {Modal, Form, Spinner, Button} from 'react-bootstrap';
import classNames from 'classnames/bind';
import style from '../exam/examtype/examtypeById/TestByExamTypePage.module.scss';
import './MyAlbumsPage.scss';

const cx = classNames.bind(style);

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
      setNewAlbum({name: '', description: '', coverUrl: ''});
    } catch (err) {
      alert('❌ Không thể tạo album mới!');
      console.error(err);
    }
  };

  if (loading)
    return (
      <div className="text-center mt-5">
        <Spinner animation="border" variant="primary" />
        <p>Đang tải...</p>
      </div>
    );

  if (errorMsg)
    return (
      <div className={cx('error-box')}>
        <p>{errorMsg}</p>
      </div>
    );

  return (
    <div className={cx('container')}>
      {/* === Thanh tiêu đề === */}
      <div className={cx('header-bar')}>
        <h3 className={cx('page-title')}>📘 Album từ vựng của tôi</h3>
        <button className={cx('btn-create')} onClick={() => setShowModal(true)}>
          ➕ Tạo album mới
        </button>
      </div>

      {/* === Nếu chưa có album === */}
      {albums.length === 0 && (
        <div className={cx('empty-box')}>
          <p>📭 Chưa có album nào được tạo.</p>
        </div>
      )}

      {/* === Danh sách album === */}
      {albums.length > 0 && (
        <div className={cx('album-grid')}>
          {albums.map((album) => (
            <div
              key={album.albumId}
              className={cx('album-card')}
              onClick={() => navigate(`/albums/${album.albumId}`)}
            >
              <img
                src={
                  album.coverUrl ||
                  'https://placehold.co/300x200/def/fff?text=Album'
                }
                alt={album.name}
                className={cx('album-cover')}
              />
              <div className={cx('album-body')}>
                <h5>{album.name}</h5>
                <p>{album.description || 'Không có mô tả'}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* === Modal tạo album === */}
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
    </div>
  );
}

export default MyAlbumsPage;
