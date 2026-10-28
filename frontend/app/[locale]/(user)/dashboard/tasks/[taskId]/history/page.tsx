import { privatePageMetadata } from '@/app/i18n/metadata';
import TaskHistory from './TaskHistory';

export const generateMetadata = privatePageMetadata('taskHistory');

export default function Page() {
  return <TaskHistory />;
}
