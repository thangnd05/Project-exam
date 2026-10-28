import { privatePageMetadata } from '@/app/i18n/metadata';
import GeneratePlan from './GeneratePlan';

export const generateMetadata = privatePageMetadata('planCreate');

export default function Page() {
  return <GeneratePlan />;
}
