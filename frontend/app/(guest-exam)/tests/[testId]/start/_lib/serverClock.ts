// Đồng hồ thi phải tính theo giờ server: máy chạy nhanh giờ sẽ bị tự nộp sớm, máy chạy chậm thì hiển thị dư thời gian.
// Neo một mốc giờ server vào performance.now() (đồng hồ đơn điệu): người dùng đổi giờ hệ thống giữa chừng
// thì Date.now() nhảy theo, còn performance.now() không bị ảnh hưởng.
let anchor: { serverMs: number; perfMs: number } | null = null;

// Mốc thời gian để truyền vào syncServerClock; lấy ngay trước khi gửi request.
export const clockMark = (): number => performance.now();

// serverNow được tạo trong lúc request đang bay, nên lấy mốc giữa lúc gửi và lúc nhận để trừ độ trễ mạng.
export const syncServerClock = (serverNow: string | null | undefined, requestedAt: number): void => {
  if (!serverNow) return;
  const serverMs = Date.parse(serverNow);
  if (Number.isNaN(serverMs)) return;
  anchor = { serverMs, perfMs: (requestedAt + performance.now()) / 2 };
};

// Chưa đồng bộ được với server (vd. mất mạng) thì đành dùng giờ máy.
export const serverNowMs = (): number =>
  anchor ? anchor.serverMs + (performance.now() - anchor.perfMs) : Date.now();
