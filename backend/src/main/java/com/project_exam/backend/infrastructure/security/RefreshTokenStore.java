package com.project_exam.backend.infrastructure.security;

public interface RefreshTokenStore {

    void createFamily(String userId, String familyId, String jti);

    String rotate(String userId, String familyId, String oldJti);

    void revokeFamily(String userId, String familyId);

    void revokeAllForUser(String userId);

    /** Access token mang "fid" của family: family bị thu hồi (logout, đổi mật khẩu) thì access token cũng hết hiệu lực. */
    boolean isFamilyRevoked(String familyId);
}
