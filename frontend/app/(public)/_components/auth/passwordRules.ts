/**
 * Quy tắc mật khẩu dùng chung cho form đổi/đặt lại mật khẩu.
 * Phải khớp với AuthService.validateNewPassword ở backend.
 * Không ép độ dài tối thiểu (giống form đăng ký), chỉ giới hạn trên vì BCrypt bỏ qua phần sau 72 ký tự.
 */

export const PASSWORD_MAX_LENGTH = 72;

export const PASSWORD_HINT = `Tối đa ${PASSWORD_MAX_LENGTH} ký tự.`;

export function isPasswordValid(value: string): boolean {
  return value.length > 0 && value.length <= PASSWORD_MAX_LENGTH;
}
