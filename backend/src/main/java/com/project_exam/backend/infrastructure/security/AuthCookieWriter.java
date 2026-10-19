package com.project_exam.backend.infrastructure.security;

import io.jsonwebtoken.Claims;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Date;

/**
 * Ghi/xoá cookie accessToken + refreshToken. Dùng chung cho đăng nhập thường, refresh và OAuth2
 * để Max-Age luôn khớp hạn của JWT (cấu hình qua jwt.expiration / jwt.refresh.expiration).
 */
@Component
public class AuthCookieWriter {

    public static final String SESSION_HINT_COOKIE = "hasSession";

    private final JwtService jwtService;
    private final boolean secure;

    public AuthCookieWriter(JwtService jwtService, @Value("${app.frontend.origin}") String frontendOrigin) {
        this.jwtService = jwtService;
        this.secure = frontendOrigin != null && frontendOrigin.startsWith("https");
    }

    public void writeTokens(HttpServletResponse response, String accessToken, String refreshToken) {
        int refreshMaxAge = maxAgeOf(refreshToken);
        response.addHeader("Set-Cookie", accessTokenCookie(encode(accessToken), maxAgeOf(accessToken)));
        response.addHeader("Set-Cookie", refreshTokenCookie(encode(refreshToken), refreshMaxAge));
        response.addHeader("Set-Cookie", sessionHintCookie("1", refreshMaxAge));
    }

    public void clearTokens(HttpServletResponse response) {
        response.addHeader("Set-Cookie", accessTokenCookie("", 0));
        response.addHeader("Set-Cookie", refreshTokenCookie("", 0));
        response.addHeader("Set-Cookie", sessionHintCookie("", 0));
    }

    private String accessTokenCookie(String value, int maxAge) {
        return "accessToken=" + value + "; HttpOnly; Path=/; Max-Age=" + maxAge + sameSiteAttr();
    }

    private String refreshTokenCookie(String value, int maxAge) {
        return "refreshToken=" + value + "; HttpOnly; Path=/api/auth/refresh; Max-Age=" + maxAge + sameSiteAttr();
    }

    /**
     * Access token chỉ sống vài phút, nên middleware Next (proxy.ts) không dựa vào cookie accessToken
     * để biết người dùng còn phiên. Cookie này sống bằng refresh token và không chứa gì bí mật.
     */
    private String sessionHintCookie(String value, int maxAge) {
        return SESSION_HINT_COOKIE + "=" + value + "; HttpOnly; Path=/; Max-Age=" + maxAge + sameSiteAttr();
    }

    private String sameSiteAttr() {
        return secure ? "; SameSite=None; Secure" : "; SameSite=Lax";
    }

    /** Cookie sống đúng bằng thời gian còn lại của JWT (exp lấy từ jwt.expiration / jwt.refresh.expiration). */
    private int maxAgeOf(String token) {
        Date expiration = jwtService.extractClaim(token, Claims::getExpiration);
        return (int) Math.max(0, (expiration.getTime() - System.currentTimeMillis()) / 1000);
    }

    private static String encode(String token) {
        return URLEncoder.encode(token, StandardCharsets.UTF_8);
    }
}
