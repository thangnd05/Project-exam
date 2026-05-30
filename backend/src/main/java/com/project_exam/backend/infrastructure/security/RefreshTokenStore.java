package com.project_exam.backend.infrastructure.security;

/**
 * Quản lý trạng thái server-side của refresh token theo mô hình "Token Family".
 *
 * Mỗi lần login = 1 family (đại diện cho 1 device/session). Mỗi family chỉ có ĐÚNG 1
 * jti hợp lệ tại 1 thời điểm. Khi refresh:
 *   - đúng jti hiện hành → rotate (cấp jti mới, đẩy jti cũ ra)
 *   - jti cũ bị submit lại → REPLAY → revoke cả family, ép login lại
 *
 * Why: JWT stateless không revoke được; với refresh token cần state để chống replay
 * và để logout thực sự vô hiệu hoá phiên ở server. Đây là chuẩn OAuth2 BCP.
 */
public interface RefreshTokenStore {

    /** Tạo family mới khi user login. Lưu jti đầu tiên là jti hợp lệ hiện hành. */
    void createFamily(String userId, String familyId, String jti);

    /**
     * Rotate refresh token: kiểm tra oldJti có phải jti hiện hành của family không.
     * Nếu khớp → ghi đè jti = newJti và gia hạn TTL (sliding window).
     * Nếu lệch → ném {@link com.project_exam.backend.shared.exception.ReplayDetectedException}
     * và revoke family.
     */
    void rotate(String userId, String familyId, String oldJti, String newJti);

    /** Logout 1 device: xoá family khỏi Redis và khỏi set của user. */
    void revokeFamily(String userId, String familyId);

    /** Logout tất cả device (đổi mật khẩu, reset password): xoá toàn bộ family của user. */
    void revokeAllForUser(String userId);
}
