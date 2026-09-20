/**
 * Quy tắc mật khẩu dùng chung cho form đổi/đặt lại mật khẩu.
 * Phải khớp với AuthService.validateNewPassword ở backend.
 */

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 72;

export const PASSWORD_HINT = `Tối thiểu ${PASSWORD_MIN_LENGTH} ký tự.`;

export function isPasswordValid(value: string): boolean {
  return value.length >= PASSWORD_MIN_LENGTH && value.length <= PASSWORD_MAX_LENGTH;
}
