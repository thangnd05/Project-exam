import { privatePageMetadata } from '@/app/i18n/metadata';
import LearningPlansRedirect from './LearningPlansRedirect';

export const generateMetadata = privatePageMetadata('learningPaths');

export default function Page() {
  return <LearningPlansRedirect />;
}
