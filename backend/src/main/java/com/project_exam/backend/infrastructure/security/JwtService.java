package com.project_exam.backend.infrastructure.security;

import com.project_exam.backend.shared.exception.UnauthorizedException;

import com.project_exam.backend.modules.users.user.repository.UserRepository;
import io.jsonwebtoken.*;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import javax.crypto.SecretKey;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.function.Function;

@Service
public class JwtService {

    private static final String TOKEN_TYPE_CLAIM = "type";
    private static final String ACCESS_TOKEN_TYPE = "access";
    private static final String REFRESH_TOKEN_TYPE = "refresh";

    @Value("${jwt.secret}")
    private String secretKey;

    @Value("${jwt.expiration}")
    private long jwtExpiration;

    @Value("${jwt.refresh.expiration}")
    private long jwtRefreshExpiration;

    private SecretKey cachedSigningKey;
    private UserRepository userRepository;
    private final RefreshTokenStore refreshTokenStore;

    public JwtService(RefreshTokenStore refreshTokenStore) {
        this.refreshTokenStore = refreshTokenStore;
    }

    @PostConstruct
    private void init() {
        byte[] keyBytes = Decoders.BASE64URL.decode(secretKey);
        this.cachedSigningKey = Keys.hmacShaKeyFor(keyBytes);
    }

    public String generateToken(UserDetails userDetails, Map<String, Object> extraClaims) {
        Map<String, Object> claims = new HashMap<>(extraClaims);
        claims.put(TOKEN_TYPE_CLAIM, ACCESS_TOKEN_TYPE);
        return Jwts.builder()
                .claims(claims)
                .subject(userDetails.getUsername())
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + jwtExpiration))
                .signWith(cachedSigningKey, Jwts.SIG.HS256)
                .compact();
    }

    public String generateToken(UserDetails userDetails) {
        return generateToken(userDetails, new HashMap<>());
    }

    public String generateRefreshToken(UserDetails userDetails, String familyId, String jti) {
        Map<String, Object> claims = new HashMap<>();
        claims.put(TOKEN_TYPE_CLAIM, REFRESH_TOKEN_TYPE);
        claims.put("fid", familyId);
        return Jwts.builder()
                .claims(claims)
                .subject(userDetails.getUsername())
                .id(jti)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + jwtRefreshExpiration))
                .signWith(cachedSigningKey, Jwts.SIG.HS256)
                .compact();
    }

    public String extractFamilyId(String token) {
        Object fid = extractAllClaims(token).get("fid");
        return fid == null ? null : fid.toString();
    }

    public String extractJti(String token) {
        return extractClaim(token, Claims::getId);
    }

    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claims != null ? claimsResolver.apply(claims) : null;
    }

    public Claims extractAllClaims(String token) {
        try {
            return Jwts.parser()
                    .verifyWith(cachedSigningKey)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
        } catch (ExpiredJwtException e) {
            throw new UnauthorizedException("Token đã hết hạn");
        } catch (JwtException e) {
            throw new UnauthorizedException("Token không hợp lệ");
        }
    }

    public boolean isTokenValid(String token, UserDetails userDetails) {
        String username = extractUsername(token);
        return username != null && username.equals(userDetails.getUsername()) && !isTokenExpired(token);
    }

    public boolean isRefreshToken(String token) {
        Claims claims = extractAllClaims(token);
        return claims != null && isRefreshClaims(claims);
    }

    /**
     * Access token dùng được để xác thực: không phải refresh token và gắn với một phiên (fid) chưa bị thu hồi.
     * Token không có fid (cấp từ bản cũ) bị từ chối, client tự gọi /api/auth/refresh để lấy token mới.
     */
    public boolean isActiveAccessToken(Claims claims) {
        if (claims == null || isRefreshClaims(claims)) {
            return false;
        }
        Object fid = claims.get("fid");
        return fid != null && !refreshTokenStore.isFamilyRevoked(fid.toString());
    }

    private boolean isRefreshClaims(Claims claims) {
        return REFRESH_TOKEN_TYPE.equals(claims.get(TOKEN_TYPE_CLAIM));
    }

    private boolean isTokenExpired(String token) {
        Date expiration = extractClaim(token, Claims::getExpiration);
        return expiration != null && expiration.before(new Date());
    }

    public Claims extractAllClaimsFromRequest(HttpServletRequest request) {
        String token = null;

        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            token = authHeader.substring(7);
        }

        else if (request.getCookies() != null) {
            for (var cookie : request.getCookies()) {
                if ("accessToken".equals(cookie.getName())) {
                    token = URLDecoder.decode(cookie.getValue(), StandardCharsets.UTF_8);
                    break;
                }
            }
        }

        if (token == null || token.isEmpty()) {
            throw new UnauthorizedException("Không tìm thấy token truy cập.");
        }

        Claims claims;
        try {
            claims = extractAllClaims(token);
        } catch (Exception e) {
            throw new UnauthorizedException("Token không hợp lệ hoặc đã hết hạn.");
        }
        if (!isActiveAccessToken(claims)) {
            throw new UnauthorizedException("Token không hợp lệ hoặc đã hết hạn.");
        }
        return claims;
    }

}

