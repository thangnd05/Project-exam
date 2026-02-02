import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Container, Spinner, Alert } from 'react-bootstrap';
import classNames from 'classnames/bind';
import {
  IoSchoolOutline,
  IoPeopleOutline,
  IoKeyOutline,
  IoBookOutline,
  IoArrowForwardOutline,
  IoPersonOutline
} from 'react-icons/io5';

import styles from './MyClassPage.module.scss';
import routes from '../../config/Routes';

const cx = classNames.bind(styles);

const MyClassesPage = () => {
  const [teachingClasses, setTeachingClasses] = useState([]);
  const [learningClasses, setLearningClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

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
        setMessage('Không thể kết nối đến máy chủ 😢');
      } finally {
        setLoading(false);
      }
    };
    fetchMyClasses();
  }, []);

  const handleViewTests = (classId) => {
    const path = routes.testClasses.replace(':classId', classId);
    navigate(path);
  };

  if (loading) {
    return (
      <div className={cx('loading-container')}>
        <Spinner animation="grow" variant="primary" size="lg" />
        <p>Đang chuẩn bị giảng đường của bạn...</p>
      </div>
    );
  }

  return (
    <div className={cx('wrapper')}>
      <Container>
        {/* === Modern Header === */}
        <div className={cx('header')}>
          <h1>Lớp học của tôi</h1>
          <p>Quản lý và tiếp cận kho học liệu từ các khóa học bạn tham gia</p>
        </div>

        {message && <Alert variant="warning" className="rounded-pill text-center mb-5">{message}</Alert>}

        {/* 👨‍🏫 Section: Lớp tôi dạy */}
        <div className={cx('section-header', 'teaching-header')}>
          <div className={cx('icon-box')}>
            <IoSchoolOutline />
          </div>
          <h3>Lớp tôi giảng dạy</h3>
        </div>

        <div className={cx('class-grid')}>
          {teachingClasses.length > 0 ? (
            teachingClasses.map((clazz) => (
              <div
                key={clazz.classId}
                className={cx('class-card', 'teaching-card')}
                onClick={() => handleViewTests(clazz.classId)}
              >
                <div className={cx('class-name')}>{clazz.className}</div>
                <div className={cx('info-item')}>
                  <IoPersonOutline />
                  <span>Vai trò: <strong>Giáo viên</strong></span>
                </div>
                <div className={cx('info-item')}>
                  <IoPeopleOutline />
                  <span>Mã Lớp: </span>
                  <span className={cx('class-id')}>
                    <IoKeyOutline size={14} />
                    {clazz.classId}
                  </span>
                </div>
                <button className={cx('btn-view')}>
                  <IoBookOutline />
                  Xem các bài test
                  <IoArrowForwardOutline />
                </button>
              </div>
            ))
          ) : (
            <div className={cx('empty-box')}>
              <IoPeopleOutline className={cx('icon')} />
              <h4>Bạn chưa tham gia giảng dạy lớp nào</h4>
            </div>
          )}
        </div>

        {/* 👨‍🎓 Section: Lớp tôi học */}
        <div className={cx('section-header', 'learning-header')}>
          <div className={cx('icon-box')}>
            <IoPeopleOutline />
          </div>
          <h3>Lớp tôi tham gia học</h3>
        </div>

        <div className={cx('class-grid')}>
          {learningClasses.length > 0 ? (
            learningClasses.map((clazz) => (
              <div
                key={clazz.classId}
                className={cx('class-card', 'learning-card')}
                onClick={() => handleViewTests(clazz.classId)}
              >
                <div className={cx('class-name')}>{clazz.className}</div>
                <div className={cx('info-item')}>
                  <IoPersonOutline />
                  <span>Giáo viên: <strong>{clazz.teacherName}</strong></span>
                </div>
                <div className={cx('info-item')}>
                  <IoPeopleOutline />
                  <span>ID Lớp: </span>
                  <span className={cx('class-id')}>
                    <IoKeyOutline size={14} />
                    {clazz.classId}
                  </span>
                </div>
                <button className={cx('btn-view')}>
                  <IoBookOutline />
                  Làm bài kiểm tra
                  <IoArrowForwardOutline />
                </button>
              </div>
            ))
          ) : (
            <div className={cx('empty-box')}>
              <IoSchoolOutline className={cx('icon')} />
              <h4>Bạn chưa tham gia học lớp nào</h4>
            </div>
          )}
        </div>
      </Container>
    </div>
  );
};

export default MyClassesPage;
