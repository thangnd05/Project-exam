/** STT câu hỏi từ API hoặc fallback theo vị trí trong danh sách (1-based). */
export const getQuestionDisplayNumber = (question, listIndex) => {
  if (question?.questionNumber != null && question.questionNumber > 0) {
    return question.questionNumber;
  }
  return listIndex + 1;
};
