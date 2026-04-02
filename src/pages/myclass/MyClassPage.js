import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Container, Spinner, Alert } from 'react-bootstrap';
import {
  IoSchoolOutline,
  IoPeopleOutline,
  IoKeyOutline,
  IoBookOutline,
  IoArrowForwardOutline,
  IoPersonOutline,
  IoSettingsOutline,
} from 'react-icons/io5';
import classNames from 'classnames/bind';

import styles from './MyClassPage.module.scss';
import routes from '../../config/Routes';
import PageHeader from '../../components/common/PageHeader/PageHeader';
import PageHeaderViewToggle from '../../components/common/PageHeader/PageHeaderViewToggle';
import ClassManagementTable from '../../components/common/ClassManagementTable/ClassManagementTable';
import { IoGridOutline, IoListOutline } from 'react-icons/io5';

const cx = classNames.bind(styles);

const MyClassesPage = () => {
  const [teachingClasses, setTeachingClasses] = useState([]);
  const [learningClasses, setLearningClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [viewMode, setViewMode] = useState('grid');
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

  const hasAnyClasses = teachingClasses.length > 0 || learningClasses.length > 0;

  const viewModeOptions = [
    { key: 'grid', title: 'Dạng lưới', icon: IoGridOutline },
    { key: 'table', title: 'Dạng bảng', icon: IoListOutline },
  ];

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
        <PageHeader
          title="Lớp học của tôi"
          label="Quản lý lớp học"
          description="Quản lý và tiếp cận kho học liệu từ các khóa học bạn tham gia"
        >
          {hasAnyClasses && (
            <PageHeaderViewToggle
              options={viewModeOptions}
              activeKey={viewMode}
              onChange={setViewMode}
            />
          )}
        </PageHeader>

        {message && (
          <Alert variant="warning" className="rounded-pill text-center mb-5">
            {message}
          </Alert>
        )}

        {/* === DẠNG LƯỚI (CARD) === */}
        {viewMode === 'grid' && (
          <>
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
                    <button
                      className={cx('btn-manage-members')}
                      onClick={(e) => handleManageMembers(e, clazz.classId)}
                    >
                      <IoPeopleOutline />
                      Quản lý học sinh
                      <IoSettingsOutline />
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
          </>
        )}

        {/* === DẠNG BẢNG === */}
        {viewMode === 'table' && (
          <>
            {/* 👨‍🏫 Section: Lớp tôi dạy */}
            {teachingClasses.length > 0 ? (
              <>
                <div className={cx('section-header', 'teaching-header')}>
                  <div className={cx('icon-box')}>
                    <IoSchoolOutline />
                  </div>
                  <h3>Lớp tôi giảng dạy</h3>
                </div>
                <ClassManagementTable
                  classes={teachingClasses.map((clazz) => ({
                    ...clazz,
                    isTeacher: true,
                  }))}
                  onEdit={handleEditClass}
                  onDelete={handleDeleteClass}
                  onManageStudents={handleManageStudents}
                />
              </>
            ) : (
              <div className={cx('empty-box')}>
                <IoSchoolOutline className={cx('icon')} />
                <h4>Bạn chưa tham gia giảng dạy lớp nào</h4>
                <p>Hãy tham gia một lớp học để bắt đầu!</p>
              </div>
            )}
          </>
        )}
      </Container>
    </div>
  );
};

export default MyClassesPage;
