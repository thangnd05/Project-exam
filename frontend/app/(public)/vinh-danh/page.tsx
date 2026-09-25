import HallOfFame from './HallOfFame';

export const metadata = {
  title: 'Bảng vinh danh',
  description: 'Bảng xếp hạng những người đã hoàn thành bài thi thử full mock.',
};

export default function Page() {
  return <HallOfFame />;
}
