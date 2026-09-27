import HallOfFame from './HallOfFame';

export const metadata = {
  title: 'Bảng vinh danh',
  description: 'Bảng xếp hạng bài thi thử full mock và top người giữ lửa theo chuỗi ngày dài nhất từng đạt.',
};

export default function Page() {
  return <HallOfFame />;
}
