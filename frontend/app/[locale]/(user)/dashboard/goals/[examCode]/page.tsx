import { privatePageMetadata } from '@/app/i18n/metadata';
import TargetDashboard from '../TargetDashboard';

// Mục tiêu của một kỳ thi: /dashboard/goals/aws-saa-c03 (slug nhóm + slug kỳ thi).
type Props = { params: Promise<{ examCode: string }> };

export const generateMetadata = privatePageMetadata('goalDetail');

export default async function Page({ params }: Props) {
  const { examCode } = await params;
  return <TargetDashboard examCode={decodeURIComponent(examCode)} />;
}
