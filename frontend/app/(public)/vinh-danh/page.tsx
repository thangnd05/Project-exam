import HallOfFame from './HallOfFame';

export const metadata = {
  title: 'Bảng vinh danh',
  description: 'Bảng xếp hạng bài thi thử đầy đủ và những người giữ lửa theo chuỗi ngày dài nhất từng đạt.',
};

export default function Page() {
  return <HallOfFame />;
}
