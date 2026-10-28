import { privatePageMetadata } from '@/app/i18n/metadata';
import TargetAchieved from './TargetAchieved';

export const generateMetadata = privatePageMetadata('goalsAchieved');

export default function Page() {
  return <TargetAchieved />;
}
