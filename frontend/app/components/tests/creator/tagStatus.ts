/**
 * Trạng thái tag của một câu hỏi, dùng chung cho bản xem trước file JSON và khung soạn thảo.
 * Câu thiếu tag vẫn lưu được nhưng không góp vào điểm theo tag và không sinh ải học trong lộ trình.
 */
export type TagStatus = 'ok' | 'missing' | 'unmatched';

export const TAG_STATUS_LABEL: Record<Exclude<TagStatus, 'ok'>, string> = {
  missing: 'Chưa có tag',
  unmatched: 'Tag không khớp',
};

type TaggedQuestion = { tagIds?: string[] | null; tagNames?: string[] | null };

const norm = (s?: string | null) => (s || '').trim().toLowerCase();

/** Tag dạng "Phần thi > Tag": trả về phần tên tag. */
export const shortTag = (spec: string) => {
  const gt = spec.indexOf('>');
  return gt >= 0 ? spec.slice(gt + 1).trim() : spec;
};

/** Đối chiếu tag ghi trong file với tag có trong hệ thống của phần thi. */
export const resolveQuestionTags = (question: TaggedQuestion, partTags: any[]) => {
  const ids: string[] = [...(question.tagIds || [])];
  const unmatched: string[] = [];
  (question.tagNames || []).forEach((spec) => {
    const tag = partTags.find((t) => norm(t.name) === norm(shortTag(spec)));
    if (tag) {
      if (!ids.includes(tag.tagId)) ids.push(tag.tagId);
    } else {
      unmatched.push(spec);
    }
  });
  return { ids, unmatched };
};

/** Bản xem trước file: có tag nào ghi sai tên là báo, kể cả khi các tag khác khớp. */
export const previewTagStatus = (question: TaggedQuestion, partTags: any[]): TagStatus => {
  const { ids, unmatched } = resolveQuestionTags(question, partTags);
  if (unmatched.length > 0) return 'unmatched';
  return ids.length > 0 ? 'ok' : 'missing';
};

/**
 * Khung soạn thảo: tag đã chọn nằm ở tagIds; tagNames chỉ còn khi nạp từ Word/JSON mà tên
 * không khớp tag nào, nên tagIds rỗng mà còn tagNames nghĩa là tag ghi trong file bị sai.
 */
export const editorTagStatus = (question: TaggedQuestion): TagStatus => {
  if ((question.tagIds || []).length > 0) return 'ok';
  return (question.tagNames || []).length > 0 ? 'unmatched' : 'missing';
};
