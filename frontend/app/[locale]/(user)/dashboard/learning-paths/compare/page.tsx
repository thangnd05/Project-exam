import { privatePageMetadata } from '@/app/i18n/metadata';
import PlanCompare from './PlanCompare';

export const generateMetadata = privatePageMetadata('planCompare');

export default function Page() {
  return <PlanCompare />;
}
