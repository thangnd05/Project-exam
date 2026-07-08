// Dữ liệu câu hỏi giả để preview trong editor (không gọi API, không chấm điểm).
// Dùng nội dung mẫu NGẮN GỌN — chỉ để xem bố cục "Câu 1" chứ không đổ nguyên văn đề thật.
export const sampleExamData = {
  visibleParts: [
    {
      testPartId: 'sample-part-1',
      questionGroups: [
        {
          passage: {
            passageId: 'sample-passage-1',
            passageType: 'READING',
            content: 'Đoạn văn mẫu để xem bố cục vùng đọc.',
          },
          questions: [
            {
              questionId: 'sample-q-1',
              questionType: 'MCQ',
              questionText: 'Nội dung câu hỏi mẫu (có đoạn văn).',
              answers: [
                { answerId: 'a1', answerLabel: 'A', answerText: 'Đáp án A' },
                { answerId: 'a2', answerLabel: 'B', answerText: 'Đáp án B' },
                { answerId: 'a3', answerLabel: 'C', answerText: 'Đáp án C' },
                { answerId: 'a4', answerLabel: 'D', answerText: 'Đáp án D' },
              ],
            },
          ],
        },
        {
          passage: null,
          questions: [
            {
              questionId: 'sample-q-2',
              questionType: 'MCQ',
              questionText: 'Nội dung câu hỏi mẫu (không có đoạn văn).',
              answers: [
                { answerId: 'b1', answerLabel: 'A', answerText: 'Đáp án A' },
                { answerId: 'b2', answerLabel: 'B', answerText: 'Đáp án B' },
                { answerId: 'b3', answerLabel: 'C', answerText: 'Đáp án C' },
                { answerId: 'b4', answerLabel: 'D', answerText: 'Đáp án D' },
              ],
            },
          ],
        },
      ],
    },
  ],
};

// allQuestions + questionIndexMap phẳng để preview timer/progress/nav.
export const sampleAllQuestions = sampleExamData.visibleParts
  .flatMap((p) => p.questionGroups)
  .flatMap((g) => g.questions);

export const sampleQuestionIndexMap = sampleAllQuestions.reduce((map, q, i) => {
  map[q.questionId] = i + 1;
  return map;
}, {});
