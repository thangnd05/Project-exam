import { requireTestRef } from '@/app/features/tests/testRef';
import TestLeaderboard from './TestLeaderboard';

type Props = { params: Promise<{ testId: string }> };

export default async function Page({ params }: Props) {
  const { testId } = await params;
  const ref = await requireTestRef(testId);
  return <TestLeaderboard testRef={ref} />;
}
