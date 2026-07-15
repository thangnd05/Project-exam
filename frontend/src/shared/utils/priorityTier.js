// Nhãn tier ưu tiên học của một ải: phản ánh MỨC ĐỘ YẾU (urgency), KHÔNG phải
// thứ tự học nền tảng. Thứ tự nền tảng do Tag.sortOrder quyết định ở backend.
export const PRIORITY_TIER_LABEL = {
  HIGH: 'Ưu tiên cao',
  MEDIUM: 'Ưu tiên vừa',
  LOW: 'Tùy chọn',
};

export const priorityTierLabel = (tier) =>
  PRIORITY_TIER_LABEL[tier] || PRIORITY_TIER_LABEL.MEDIUM;
