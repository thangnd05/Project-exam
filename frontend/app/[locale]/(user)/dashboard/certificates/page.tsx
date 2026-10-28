import { privatePageMetadata } from '@/app/i18n/metadata';
import MyCertificates from './MyCertificates';

export const generateMetadata = privatePageMetadata('certificates');

export default function Page() {
  return <MyCertificates />;
}
