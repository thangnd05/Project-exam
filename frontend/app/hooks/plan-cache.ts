import type { QueryClient } from '@tanstack/react-query';
const PLAN_QUERY_PREFIXES = [
  ['learning-plan-list'],
  ['learning-plans'],
  ['learning-plan-detail'],
  ['target-dashboard'],
];

export function invalidatePlanQueries(queryClient: QueryClient): void {
  PLAN_QUERY_PREFIXES.forEach((queryKey) => {
    queryClient.invalidateQueries({ queryKey });
  });
}
