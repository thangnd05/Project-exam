// Độ lệch giữa đồng hồ máy người dùng và server. Đồng hồ thi phải tính theo giờ server:
// máy chạy nhanh giờ sẽ bị tự nộp sớm, máy chạy chậm thì hiển thị dư thời gian.
let offsetMs = 0;

// serverNow được tạo trong lúc request đang bay, nên lấy mốc giữa lúc gửi và lúc nhận để trừ độ trễ mạng.
export const syncServerClock = (serverNow: string | null | undefined, requestedAt: number): void => {
  if (!serverNow) return;
  const serverMs = Date.parse(serverNow);
  if (Number.isNaN(serverMs)) return;
  offsetMs = serverMs - (requestedAt + Date.now()) / 2;
};

export const serverNowMs = (): number => Date.now() + offsetMs;
