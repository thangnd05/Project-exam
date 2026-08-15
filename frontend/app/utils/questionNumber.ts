export const getQuestionDisplayNumber = (
  question: { questionNumber?: number | null } | null | undefined,
  listIndex: number,
): number => {
  if (question?.questionNumber != null && question.questionNumber > 0) {
    return question.questionNumber;
  }
  return listIndex + 1;
};
