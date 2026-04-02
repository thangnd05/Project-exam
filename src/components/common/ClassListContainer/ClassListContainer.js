import React, { useState } from 'react';
import { Container } from 'react-bootstrap';
import { IoListOutline, IoGridOutline, IoSchoolOutline, IoPeopleOutline } from 'react-icons/io5';
import classNames from 'classnames/bind';
import styles from './ClassListContainer.module.scss';
import PageHeader from '~/components/common/PageHeader/PageHeader';
import PageHeaderViewToggle from '~/components/common/PageHeader/PageHeaderViewToggle';
import ClassCard from '~/components/common/ClassCard/ClassCard';
import ClassManagementTable from '~/components/common/ClassManagementTable/ClassManagementTable';

const cx = classNames.bind(styles);

const ClassListContainer = ({
  title,
  label,
  description,
  teachingClasses = [],
  learningClasses = [],
  onViewTests,
  onManageMembers,
  onEditClass,
  onDeleteClass,
  onManageStudents,
  emptyMessage,
}) => {
  const [viewMode, setViewMode] = useState('grid');
  const hasTeaching = teachingClasses.length > 0;
  const hasLearning = learningClasses.length > 0;
  const hasAnyClasses = hasTeaching || hasLearning;

  const viewModeOptions = [
    { key: 'grid', title: 'Dạng lưới', icon: IoGridOutline },
    { key: 'table', title: 'Dạng bảng', icon: IoListOutline },
  ];

  return (
    <div className={cx('wrapper')}>
      <Container>
        <PageHeader title={title} label={label} description={description}>
          {hasAnyClasses && (
            <PageHeaderViewToggle
              options={viewModeOptions}
              activeKey={viewMode}
              onChange={setViewMode}
            />
          )}
        </PageHeader>

        {/* === GRID VIEW === */}
        {viewMode === 'grid' && (
          <>
            {/* Teaching Classes */}
            <div className={cx('section-header', 'teaching-header')}>
              <div className={cx('icon-box')}>
                <IoSchoolOutline />
              </div>
              <h3>Lớp tôi giảng dạy</h3>
            </div>

            <div className={cx('class-grid')}>
              {hasTeaching ? (
                teachingClasses.map((clazz) => (
                  <ClassCard
                    key={clazz.classId}
                    classData={clazz}
                    role="teacher"
                    onViewTests={onViewTests}
                    onManageMembers={onManageMembers}
                  />
                ))
              ) : (
                <div className={cx('empty-box')}>
                  <IoPeopleOutline className={cx('icon')} />
                  <h4>Bạn chưa tham gia giảng dạy lớp nào</h4>
                </div>
              )}
            </div>

            {/* Learning Classes */}
            <div className={cx('section-header', 'learning-header')}>
              <div className={cx('icon-box')}>
                <IoPeopleOutline />
              </div>
              <h3>Lớp tôi tham gia học</h3>
            </div>

            <div className={cx('class-grid')}>
              {hasLearning ? (
                learningClasses.map((clazz) => (
                  <ClassCard
                    key={clazz.classId}
                    classData={clazz}
                    role="student"
                    onViewTests={onViewTests}
                  />
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

        {/* === TABLE VIEW === */}
        {viewMode === 'table' && (
          <>
            {hasTeaching ? (
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
                  onEdit={onEditClass}
                  onDelete={onDeleteClass}
                  onManageStudents={onManageStudents}
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

export default ClassListContainer;