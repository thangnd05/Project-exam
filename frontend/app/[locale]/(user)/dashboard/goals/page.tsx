import { privatePageMetadata } from '@/app/i18n/metadata';
import TargetDashboard from './TargetDashboard';

export const generateMetadata = privatePageMetadata('goals');

export default function Page() {
  return <TargetDashboard />;
}
