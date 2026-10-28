import { privatePageMetadata } from '@/app/i18n/metadata';
import { requireTestRef } from '@/app/features/tests/testRef';
import TestHistory from './TestHistory';

type Props = { params: Promise<{ testId: string }> };

export const generateMetadata = privatePageMetadata('mockAttempts');

export default async function Page({ params }: Props) {
  const { testId } = await params;
  const ref = await requireTestRef(testId);
  return <TestHistory testRef={ref} />;
}
