import { privatePageMetadata } from '@/app/i18n/metadata';
import ProfileOverview from './ProfileOverview';

export const generateMetadata = privatePageMetadata('dashboard');

export default function Page() {
  return <ProfileOverview />;
}
