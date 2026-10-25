package com.project_exam.backend.infrastructure.security;

import com.project_exam.backend.shared.exception.UnauthorizedException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Encoders;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class JwtServiceTokenTypeTest {

    private final UserDetails user = User.withUsername("a@example.com").password("").authorities("ROLE_USER").build();
    private JwtService jwtService;
    private RefreshTokenStore refreshTokenStore;

    @BeforeEach
    void setUp() {
        refreshTokenStore = mock(RefreshTokenStore.class);
        jwtService = new JwtService(refreshTokenStore);
        String secret = Encoders.BASE64URL.encode(Jwts.SIG.HS256.key().build().getEncoded());
        ReflectionTestUtils.setField(jwtService, "secretKey", secret);
        ReflectionTestUtils.setField(jwtService, "jwtExpiration", 60_000L);
        ReflectionTestUtils.setField(jwtService, "jwtRefreshExpiration", 120_000L);
        ReflectionTestUtils.invokeMethod(jwtService, "init");
    }

    @Test
    @DisplayName("Access token được nhận là access token, không phải refresh token")
    void accessTokenIsAccessToken() {
        String token = jwtService.generateToken(user, Map.of("userId", "u1", "fid", "f1"));

        assertTrue(jwtService.isActiveAccessToken(jwtService.extractAllClaims(token)));
        assertFalse(jwtService.isRefreshToken(token));
    }

    @Test
    @DisplayName("Refresh token không được dùng như access token")
    void refreshTokenIsNotAccessToken() {
        String token = jwtService.generateRefreshToken(user, "fid", "jti");

        assertTrue(jwtService.isRefreshToken(token));
        assertFalse(jwtService.isActiveAccessToken(jwtService.extractAllClaims(token)));
    }

    @Test
    @DisplayName("extractAllClaimsFromRequest từ chối refresh token đặt vào cookie accessToken")
    void extractClaimsFromRequestRejectsRefreshToken() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setCookies(new Cookie("accessToken", jwtService.generateRefreshToken(user, "fid", "jti")));

        assertThrows(UnauthorizedException.class, () -> jwtService.extractAllClaimsFromRequest(request));
    }

    @Test
    @DisplayName("extractAllClaimsFromRequest trả claims của access token")
    void extractClaimsFromRequestAcceptsAccessToken() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setCookies(new Cookie("accessToken",
                jwtService.generateToken(user, Map.of("userId", "u1", "fid", "f1"))));

        assertEquals("u1", jwtService.extractAllClaimsFromRequest(request).get("userId"));
    }

    @Test
    @DisplayName("Access token của phiên đã thu hồi (logout / đổi mật khẩu) không còn dùng được")
    void revokedFamilyAccessTokenIsRejected() {
        when(refreshTokenStore.isFamilyRevoked("f1")).thenReturn(true);
        String token = jwtService.generateToken(user, Map.of("userId", "u1", "fid", "f1"));

        assertFalse(jwtService.isActiveAccessToken(jwtService.extractAllClaims(token)));

        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setCookies(new Cookie("accessToken", token));
        assertThrows(UnauthorizedException.class, () -> jwtService.extractAllClaimsFromRequest(request));
    }

    @Test
    @DisplayName("Access token không gắn phiên (thiếu fid) bị từ chối để client refresh lấy token mới")
    void accessTokenWithoutFamilyIsRejected() {
        String token = jwtService.generateToken(user, Map.of("userId", "u1"));

        assertFalse(jwtService.isActiveAccessToken(jwtService.extractAllClaims(token)));
    }

    @Test
    @DisplayName("Access token của phiên còn hiệu lực được chấp nhận")
    void activeFamilyAccessTokenIsAccepted() {
        String token = jwtService.generateToken(user, Map.of("userId", "u1", "fid", "f1"));

        assertTrue(jwtService.isActiveAccessToken(jwtService.extractAllClaims(token)));
    }
}
