package com.project_exam.backend.infrastructure.security;

import com.project_exam.backend.shared.exception.UnauthorizedException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.io.Encoders;
import io.jsonwebtoken.security.Keys;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.test.util.ReflectionTestUtils;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class JwtServiceTokenTypeTest {

    private final UserDetails user = User.withUsername("a@example.com").password("").authorities("ROLE_USER").build();
    private JwtService jwtService;

    @BeforeEach
    void setUp() {
        jwtService = new JwtService();
        String secret = Encoders.BASE64URL.encode(Keys.secretKeyFor(SignatureAlgorithm.HS256).getEncoded());
        ReflectionTestUtils.setField(jwtService, "secretKey", secret);
        ReflectionTestUtils.setField(jwtService, "jwtExpiration", 60_000L);
        ReflectionTestUtils.setField(jwtService, "jwtRefreshExpiration", 120_000L);
        ReflectionTestUtils.invokeMethod(jwtService, "init");
    }

    @Test
    @DisplayName("Access token được nhận là access token, không phải refresh token")
    void accessTokenIsAccessToken() {
        String token = jwtService.generateToken(user, Map.of("userId", "u1"));

        assertTrue(jwtService.isAccessToken(token));
        assertFalse(jwtService.isRefreshToken(token));
    }

    @Test
    @DisplayName("Refresh token không được dùng như access token")
    void refreshTokenIsNotAccessToken() {
        String token = jwtService.generateRefreshToken(user, "fid", "jti");

        assertTrue(jwtService.isRefreshToken(token));
        assertFalse(jwtService.isAccessToken(token));
    }

    @Test
    @DisplayName("Access token cũ chưa có claim type vẫn hợp lệ")
    void legacyAccessTokenWithoutTypeIsAccepted() {
        SecretKey key = (SecretKey) ReflectionTestUtils.getField(jwtService, "cachedSigningKey");
        String legacy = Jwts.builder()
                .setSubject(user.getUsername())
                .setExpiration(new Date(System.currentTimeMillis() + 60_000))
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();

        assertTrue(jwtService.isAccessToken(legacy));
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
        request.setCookies(new Cookie("accessToken", jwtService.generateToken(user, Map.of("userId", "u1"))));

        assertEquals("u1", jwtService.extractAllClaimsFromRequest(request).get("userId"));
    }
}
