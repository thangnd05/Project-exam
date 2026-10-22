'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {Container} from 'react-bootstrap';
import {motion} from 'framer-motion';
import type {Variants} from 'framer-motion';
import {
  IoListOutline,
  IoGridOutline,
  IoSchoolOutline,
  IoPeopleOutline,
} from 'react-icons/io5';
import classNames from 'classnames/bind';
import styles from './ClassListContainer.module.scss';
import PageHeader from '@/app/components/PageHeader/PageHeader';
import PageHeaderViewToggle from '@/app/components/PageHeader/PageHeaderViewToggle';
import ClassCard from '@/app/[locale]/(user)/my-classes/_components/ClassCard/ClassCard';
import ClassManagementTable from '@/app/[locale]/(user)/my-classes/_components/ClassManagementTable/ClassManagementTable';
import type { ClassStudentResponse } from '@/app/types';

const cx = classNames.bind(styles);

const sectionHeaderVariants: Variants = {
  hidden: {opacity: 0, y: 16},
  visible: {
    opacity: 1,
    y: 0,
    transition: {duration: 0.5, ease: [0.22, 1, 0.36, 1]},
  },
};

const cardVariants: Variants = {
  hidden: {opacity: 0, y: 24},
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      delay: i * 0.07,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
};

const emptyVariants: Variants = {
  hidden: {opacity: 0, scale: 0.97},
  visible: {
    opacity: 1,
    scale: 1,
    transition: {duration: 0.5, ease: [0.22, 1, 0.36, 1]},
  },
};

type ClassListContainerProps = {
  title: string;
  label?: string;
  description?: React.ReactNode;
  teachingClasses?: ClassStudentResponse[];
  learningClasses?: ClassStudentResponse[];
  onViewTests?: (classId: string) => void;
  onManageMembers?: (e: React.MouseEvent, classId: string) => void;
  onEditClass?: (classData: ClassStudentResponse) => void;
  onDeleteClass?: (classData: ClassStudentResponse) => void;
  onManageStudents?: (classId: string) => void;
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
}: ClassListContainerProps) => {
  const t = useTranslations('Classes');
  const [viewMode, setViewMode] = useState('grid');
  const hasTeaching = teachingClasses.length > 0;
  const hasLearning = learningClasses.length > 0;
  const hasAnyClasses = hasTeaching || hasLearning;

  const viewModeOptions = [
    {key: 'grid', title: t('common.viewGrid'), icon: IoGridOutline},
    {key: 'table', title: t('classList.viewTable'), icon: IoListOutline},
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

        {viewMode === 'grid' && (
          <>

            <motion.div
              className={cx('section-header', 'teaching-header')}
              initial="hidden"
              whileInView="visible"
              viewport={{once: true, amount: 0.5}}
              variants={sectionHeaderVariants}
            >
              <h3>{t('common.teachingClasses')}</h3>
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
                  <h4>{t('common.noTeachingClasses')}</h4>
                </motion.div>
              )}
            </div>

            <motion.div
              className={cx('section-header', 'learning-header')}
              initial="hidden"
              whileInView="visible"
              viewport={{once: true, amount: 0.5}}
              variants={sectionHeaderVariants}
            >
              <h3>{t('classList.learningClasses')}</h3>
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
                  <h4>{t('classList.noLearningClasses')}</h4>
                </motion.div>
              )}
            </div>
          </>
        )}

        {viewMode === 'table' && (
          <>
            {hasTeaching ? (
              <>
                <div className={cx('section-header', 'teaching-header')}>
                  <div className={cx('icon-box')}>
                    <IoSchoolOutline />
                  </div>
                  <h3>{t('common.teachingClasses')}</h3>
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
                <h4>{t('common.noTeachingClasses')}</h4>
                <p>{t('classList.joinHint')}</p>
              </div>
            )}
          </>
        )}
      </Container>
    </div>
  );
};

export default ClassListContainer;
