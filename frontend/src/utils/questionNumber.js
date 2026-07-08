
export const getQuestionDisplayNumber = (question, listIndex) => {
  if (question?.questionNumber != null && question.questionNumber > 0) {
    return question.questionNumber;
  }
  return listIndex + 1;
};
