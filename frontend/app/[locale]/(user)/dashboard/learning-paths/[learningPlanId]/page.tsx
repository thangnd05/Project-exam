import { privatePageMetadata } from '@/app/i18n/metadata';
import PlanDetail from './PlanDetail';

export const generateMetadata = privatePageMetadata('planDetail');

export default function Page() {
  return <PlanDetail />;
}
