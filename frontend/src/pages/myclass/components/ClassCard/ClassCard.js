import {
  IoPeopleOutline,
  IoKeyOutline,
  IoBookOutline,
  IoArrowForwardOutline,
  IoPersonOutline,
  IoSettingsOutline,
} from 'react-icons/io5';
import classNames from 'classnames/bind';
import styles from './ClassCard.module.scss';

const cx = classNames.bind(styles);

const ClassCard = ({ classData, role = 'teacher', onViewTests, onManageMembers }) => {
  const classQr = classData.classQr ;

  return (
    <div
      className={cx('class-card', role === 'teacher' ? 'teaching-card' : 'learning-card')}
      onClick={() => onViewTests?.(classData.classId)}
    >
      <div className={cx('class-name')}>{classData.className}</div>

      <div className={cx('info-item')}>
        <IoPersonOutline />
        {role === 'teacher' ? (
          <span>Vai trò: <strong>Giáo viên</strong></span>
        ) : (
          <span>Giáo viên: <strong>{classData.teacherName || 'N/A'}</strong></span>
        )}
      </div>

      <div className={cx('info-item')}>
        <IoPeopleOutline />
        <span>Mã lớp:</span>
        <span className={cx('class-id')}>
          <IoKeyOutline size={14} />
          {classQr}
        </span>
      </div>

      <button className={cx('btn-view')}>
        <IoBookOutline />
        {role === 'teacher' ? 'Xem các bài test' : 'Làm bài kiểm tra'}
        <IoArrowForwardOutline />
      </button>

      {role === 'teacher' && (
        <button
          className={cx('btn-manage-members')}
          onClick={(e) => {
            e.stopPropagation();
            onManageMembers?.(e, classData.classId);
          }}
        >
          <IoPeopleOutline />
          Quản lý học sinh
          <IoSettingsOutline />
        </button>
      )}
    </div>
  );
};

export default ClassCard;