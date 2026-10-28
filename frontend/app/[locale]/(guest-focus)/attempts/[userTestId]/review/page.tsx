import { privatePageMetadata } from '@/app/i18n/metadata';
import TestReview from './TestReview';

export const generateMetadata = privatePageMetadata('attemptReview');

export default function Page() {
  return <TestReview />;
}
