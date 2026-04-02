import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Spinner, Alert } from 'react-bootstrap';
import classNames from 'classnames/bind';

import styles from './MyClassPage.module.scss';
import routes from '../../config/Routes';
import ClassListContainer from '../../components/common/ClassListContainer/ClassListContainer';

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
    const path = routes.classChapterPage.replace(':classId', classId);
    navigate(path);
  };

  const handleManageMembers = (e, classId) => {
    e.stopPropagation();
    const path = routes.classMemberManagement.replace(':classId', classId);
    navigate(path);
  };

  const handleEditClass = (classId) => {
    console.log('Edit class:', classId);
  };

  const handleDeleteClass = (classId) => {
    console.log('Delete class:', classId);
  };

  const handleManageStudents = (classId) => {
    const path = routes.classMemberManagement.replace(':classId', classId);
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
    <>
      {message && (
        <Alert variant="warning" className="rounded-pill text-center mx-5 mt-5">
          {message}
        </Alert>
      )}

      <ClassListContainer
        title="Lớp học của tôi"
        label="Quản lý lớp học"
        description="Quản lý và tiếp cận kho học liệu từ các khóa học bạn tham gia"
        teachingClasses={teachingClasses}
        learningClasses={learningClasses}
        onViewTests={handleViewTests}
        onManageMembers={handleManageMembers}
        onEditClass={handleEditClass}
        onDeleteClass={handleDeleteClass}
        onManageStudents={handleManageStudents}
      />
    </>
  );
};

export default MyClassesPage;