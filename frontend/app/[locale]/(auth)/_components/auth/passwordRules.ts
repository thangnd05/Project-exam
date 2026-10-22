/**
 * Quy tắc mật khẩu dùng chung cho form đổi/đặt lại mật khẩu.
 * Phải khớp với AuthService.validateNewPassword ở backend.
 * Không ép độ dài tối thiểu (giống form đăng ký), chỉ giới hạn trên vì BCrypt bỏ qua phần sau 72 ký tự.
 * Câu gợi ý hiển thị nằm ở message Auth.reset.passwordHint (tham số max = PASSWORD_MAX_LENGTH).
 */

export const PASSWORD_MAX_LENGTH = 72;

export function isPasswordValid(value: string): boolean {
  return value.length > 0 && value.length <= PASSWORD_MAX_LENGTH;
}
