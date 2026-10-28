import { privatePageMetadata } from '@/app/i18n/metadata';
import TestResult from './TestResult';

export const generateMetadata = privatePageMetadata('attemptResult');

export default function Page() {
  return <TestResult />;
}
