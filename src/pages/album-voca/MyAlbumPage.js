import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Spinner, Container } from 'react-bootstrap';
import classNames from 'classnames/bind';
import { IoAddCircleOutline, IoFolderOpenOutline, IoDocumentTextOutline } from "react-icons/io5";
import { FaBook } from "react-icons/fa";

import styles from './MyAlbumPage.module.scss';

import CreateAlbumModal from '../../components/modals/CreateAlbumModal';
import PageHeader from '../../components/common/PageHeader/PageHeader';

const cx = classNames.bind(styles);

function MyAlbumsPage() {
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

  // 🟢 Lấy danh sách album
  const fetchAlbums = async () => {
    try {
      const res = await axios.get('/api/vocabulary-albums/my-albums');
      setAlbums(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlbums();
  }, []);

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
        {/* === Header Dashboard === */}
        <PageHeader
          title="Album từ vựng"
          label="Lưu trữ và quản lý hành trình chinh phục ngôn ngữ của bạn"
          actionText="Tạo album mới"
          actionIcon={IoAddCircleOutline}
          onAction={() => setShowModal(true)}
        />

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
            {albums.map((album, index) => (
              <div
                key={album.albumId}
                className={cx('album-card')}
                onClick={() => navigate(`/albums/${album.albumId}`)}
              >
                <div className={cx('card-top')}>
                  <div className={cx('card-icon')}>
                    <FaBook />
                  </div>
                  <span className={cx('index')}>
                    {(index + 1).toString().padStart(2, '0')}
                  </span>
                </div>

                <h3 className={cx('album-title')}>{album.name}</h3>

                <div className={cx('album-info')}>
                  <IoDocumentTextOutline />
                  <span>
                    {album.description || 'Hành trình chinh phục từ vựng mỗi ngày'}
                  </span>
                </div>

                <button className={cx('btn-view')}>
                  Bắt đầu học ngay
                </button>
              </div>
            ))}
          </div>
        )}
      </Container>

      {/* === Modal tạo album Standardized === */}
      <CreateAlbumModal
        show={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={fetchAlbums}
      />
    </div>
  );
}

export default MyAlbumsPage;
