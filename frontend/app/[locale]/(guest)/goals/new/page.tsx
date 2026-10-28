import { privatePageMetadata } from '@/app/i18n/metadata';
import UserTarget from './UserTarget';

export const generateMetadata = privatePageMetadata('goalNew');

export default function Page() {
  return <UserTarget />;
}
