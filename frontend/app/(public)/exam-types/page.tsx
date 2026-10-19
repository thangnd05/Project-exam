import ExamCatalog from './ExamCatalog';

export const metadata = {
  title: 'Kho đề thi',
  description:
    'Kho đề thi chứng chỉ Cloud trên WinDe: lọc theo hãng và cấp độ, thi nhanh hoặc làm đề full sát format thật.',
};

export default function Page() {
  return <ExamCatalog />;
}
