import {useState} from 'react';
import {Link} from 'react-router-dom';
import {useQuery} from '@tanstack/react-query';
import classNames from 'classnames/bind';

import {getStandardExamTypes} from '~/shared/api/examTypeApi';
import {examTypeKeys} from '~/features/tests/exam/exam-types/examTypeKeys';
import styles from './ExamTypeGrid.module.scss';

const cx = classNames.bind(styles);

const SKELETON_COUNT = 6;

const normalizeExamTypes = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (payload && Array.isArray(payload.data)) return payload.data;
  if (payload && Array.isArray(payload.content)) return payload.content;
  return [];
};

const getInitials = (name) => {
  if (!name) return '?';
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
};

const getSubtitle = (type) =>
  type.childCount > 0 ? `${type.childCount} kỳ thi` : 'Kỳ thi chuẩn';

function ExamTypeGrid() {
  const {data: examTypes = [], isLoading} = useQuery({
    queryKey: examTypeKeys.standard,
    queryFn: getStandardExamTypes,
    // Chỉ lấy kỳ thi cha; endpoint /standard đã loại các loại đề linh hoạt.
    select: (payload) => normalizeExamTypes(payload).filter((t) => !t.parentId),
  });

  return (
    <section id="exam-types" className={cx('section')} aria-label="Khám phá loại đề">
      <div className={cx('atmosphere')} aria-hidden="true">
        <span className={cx('orb', 'orbA')} />
        <span className={cx('orb', 'orbB')} />
      </div>

      <div className={cx('inner')}>
        <header className={cx('header')}>
          <h2 className={cx('title')}>Chọn kỳ thi của bạn</h2>
          <p className={cx('subtitle')}>
            Chạm vào kỳ thi bạn đang theo đuổi để bắt đầu hành trình
          </p>
        </header>

        {isLoading ? (
          <div className={cx('grid')} aria-hidden="true">
            {Array.from({length: SKELETON_COUNT}, (_, i) => (
              <div key={i} className={cx('card', 'skeleton')} />
            ))}
          </div>
        ) : examTypes.length === 0 ? (
          <p className={cx('empty')}>Chưa có loại đề để hiển thị</p>
        ) : (
          <div className={cx('grid')}>
            {examTypes.map((type) => (
              <ExamTypeCard key={type.examTypeId} type={type} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function ExamTypeCard({type}) {
  const [imgFailed, setImgFailed] = useState(false);
  const showImage = Boolean(type.imageUrl) && !imgFailed;

  return (
    <Link
      to={`/exam-types/${type.examTypeId}`}
      className={cx('card')}
      aria-label={`Mở ${type.name}`}
    >
      <div className={cx('monogram', {hasImage: showImage})} aria-hidden="true">
        {showImage ? (
          <img
            className={cx('monogramImg')}
            src={type.imageUrl}
            alt=""
            onError={() => setImgFailed(true)}
          />
        ) : (
          getInitials(type.name)
        )}
      </div>
      <h3 className={cx('cardName')}>{type.name}</h3>
      <p className={cx('cardMeta')}>{getSubtitle(type)}</p>
      <span className={cx('cardCta')} aria-hidden="true">
        Chọn để mở
      </span>
    </Link>
  );
}

export default ExamTypeGrid;
