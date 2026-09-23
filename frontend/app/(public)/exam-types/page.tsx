import ExamCatalog from './ExamCatalog';

export const metadata = {
  title: 'Kỳ thi AWS',
  description:
    'Danh sách chứng chỉ AWS đang mở trên WinDe: SAA-C03, SAP-C02, DOP-C02. Luyện đề sát format, chấm thang 100–1000.',
};

export default function Page() {
  return <ExamCatalog />;
}
