
export function toPlanResult(data) {
  return {
    reviewItems: data.lastReviewItems,
    passed: !!data.passed,
    accuracy: data.accuracy ?? 0,
  };
}
