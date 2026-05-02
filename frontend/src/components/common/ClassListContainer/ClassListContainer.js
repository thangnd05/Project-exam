import React, {useState} from 'react';
import {Container} from 'react-bootstrap';
import {motion} from 'framer-motion';
import {
  IoListOutline,
  IoGridOutline,
  IoSchoolOutline,
  IoPeopleOutline,
} from 'react-icons/io5';
import classNames from 'classnames/bind';
import styles from './ClassListContainer.module.scss';
import PageHeader from '~/components/common/PageHeader/PageHeader';
import PageHeaderViewToggle from '~/components/common/PageHeader/PageHeaderViewToggle';
import ClassCard from '~/components/common/ClassCard/ClassCard';
import ClassManagementTable from '~/components/common/ClassManagementTable/ClassManagementTable';

const cx = classNames.bind(styles);

const sectionHeaderVariants = {
  hidden: {opacity: 0, y: 16},
  visible: {
    opacity: 1,
    y: 0,
    transition: {duration: 0.5, ease: [0.22, 1, 0.36, 1]},
  },
};

const cardVariants = {
  hidden: {opacity: 0, y: 24},
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      delay: i * 0.07,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
};

const emptyVariants = {
  hidden: {opacity: 0, scale: 0.97},
  visible: {
    opacity: 1,
    scale: 1,
    transition: {duration: 0.5, ease: [0.22, 1, 0.36, 1]},
  },
};

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
    {key: 'grid', title: 'Dạng lưới', icon: IoGridOutline},
    {key: 'table', title: 'Dạng bảng', icon: IoListOutline},
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
            <motion.div
              className={cx('section-header', 'teaching-header')}
              initial="hidden"
              whileInView="visible"
              viewport={{once: true, amount: 0.5}}
              variants={sectionHeaderVariants}
            >
              <div className={cx('icon-box')}>
                <IoSchoolOutline />
              </div>
              <h3>Lớp tôi giảng dạy</h3>
            </motion.div>

            <div className={cx('class-grid')}>
              {hasTeaching ? (
                teachingClasses.map((clazz, index) => (
                  <motion.div
                    key={clazz.classId}
                    custom={index}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{once: true, amount: 0.2}}
                    variants={cardVariants}
                  >
                    <ClassCard
                      classData={clazz}
                      role="teacher"
                      onViewTests={onViewTests}
                      onManageMembers={onManageMembers}
                    />
                  </motion.div>
                ))
              ) : (
                <motion.div
                  className={cx('empty-box')}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{once: true, amount: 0.4}}
                  variants={emptyVariants}
                >
                  <IoPeopleOutline className={cx('icon')} />
                  <h4>Bạn chưa tham gia giảng dạy lớp nào</h4>
                </motion.div>
              )}
            </div>

            {/* Learning Classes */}
            <motion.div
              className={cx('section-header', 'learning-header')}
              initial="hidden"
              whileInView="visible"
              viewport={{once: true, amount: 0.5}}
              variants={sectionHeaderVariants}
            >
              <div className={cx('icon-box')}>
                <IoPeopleOutline />
              </div>
              <h3>Lớp tôi tham gia học</h3>
            </motion.div>

            <div className={cx('class-grid')}>
              {hasLearning ? (
                learningClasses.map((clazz, index) => (
                  <motion.div
                    key={clazz.classId}
                    custom={index}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{once: true, amount: 0.2}}
                    variants={cardVariants}
                  >
                    <ClassCard
                      classData={clazz}
                      role="student"
                      onViewTests={onViewTests}
                    />
                  </motion.div>
                ))
              ) : (
                <motion.div
                  className={cx('empty-box')}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{once: true, amount: 0.4}}
                  variants={emptyVariants}
                >
                  <IoSchoolOutline className={cx('icon')} />
                  <h4>Bạn chưa tham gia học lớp nào</h4>
                </motion.div>
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
