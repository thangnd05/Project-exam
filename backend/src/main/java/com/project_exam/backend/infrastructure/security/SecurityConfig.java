package com.project_exam.backend.infrastructure.security;

import com.project_exam.backend.modules.users.user.domain.User;
import com.project_exam.backend.modules.users.user.repository.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.authentication.www.BasicAuthenticationFilter;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.security.web.csrf.CsrfTokenRequestAttributeHandler;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;
    private final CustomUserDetailsService customUserDetailsService;
    private final UserRepository userRepository;
    private final com.fasterxml.jackson.databind.ObjectMapper objectMapper;
    private final AuthRateLimitFilter authRateLimitFilter;
    private final RefreshTokenStore refreshTokenStore;

    @Value("${app.frontend.origin}")
    private String frontendOrigin;

    public SecurityConfig(
            JwtService jwtService,
            UserDetailsService userDetailsService,
            CustomUserDetailsService customUserDetailsService,
            UserRepository userRepository,
            com.fasterxml.jackson.databind.ObjectMapper objectMapper,
            AuthRateLimitFilter authRateLimitFilter,
            RefreshTokenStore refreshTokenStore
    ) {
        this.jwtService = jwtService;
        this.userDetailsService = userDetailsService;
        this.customUserDetailsService = customUserDetailsService;
        this.userRepository = userRepository;
        this.objectMapper = objectMapper;
        this.authRateLimitFilter = authRateLimitFilter;
        this.refreshTokenStore = refreshTokenStore;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {

        JwtAuthenticationFilter jwtFilter = new JwtAuthenticationFilter(jwtService, userDetailsService);

        // 1. Cấu hình Handler để Spring nhận diện Header X-XSRF-TOKEN từ Axios
        CsrfTokenRequestAttributeHandler requestHandler = new CsrfTokenRequestAttributeHandler();
        requestHandler.setCsrfRequestAttributeName(null); 

        // Tự động nhận diện môi trường để cấu hình Secure Cookie
        boolean isProduction = frontendOrigin != null && frontendOrigin.startsWith("https");

        http
                // 2. Cấu hình CSRF với Repository tùy chỉnh
                .csrf(csrf -> csrf
                        .csrfTokenRepository(customCsrfTokenRepository(isProduction)) 
                        .csrfTokenRequestHandler(requestHandler)
                        .ignoringRequestMatchers(
                                "/api/auth/login",
                                "/api/auth/register",
                                "/api/auth/refresh",
                                "/api/auth/forgot-password",
                                "/api/auth/reset-password",
                                "/api/user-tests/guest",
                                "/api/user-tests/*/guest-submit",
                                "/api/user-answers/guest/**",
                                "/api/analytics/visit",
                                "/oauth2/**",
                                "/login/oauth2/**"
                        )
                )
                // .csrf(csrf -> csrf.disable())

                // 3. CORS
                .cors(cors -> {})

                // 4. Exception Handling
                .exceptionHandling(exception -> exception
                        .authenticationEntryPoint((request, response, authException) -> {
                            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                            response.setContentType("application/json;charset=UTF-8");
                            Map<String, String> errorData = new HashMap<>();
                            errorData.put("error", "Unauthorized");
                            errorData.put("message", authException.getMessage());
                            
                            response.getWriter().write(objectMapper.writeValueAsString(errorData));
                        })
                )

                // 5. Stateless Session
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )

                // 6. Authorize Requests
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.POST, "/api/auth/**").permitAll()
                        .requestMatchers(HttpMethod.GET,
                                "/api/exam-types/**",
                                "/api/exam-categories/**",
                                "/api/evaluations/**",
                                "/api/tests/**",
                                "/api/auth/verify",
                                "/api/posts/**",
                                "/api/categories/**",
                                "/api/tags/**",
                                "/api/recovery-resources/**",
                                "/api/milestones/**",
                                "/v3/api-docs/**",
                                "/swagger-ui/**").permitAll()
                        // Guest endpoints — không yêu cầu JWT, định danh bằng header X-Guest-Session.
                        .requestMatchers(
                                "/api/user-tests/guest",
                                "/api/user-tests/guest/**",
                                "/api/user-tests/*/guest-submit",
                                "/api/user-answers/guest/**"
                        ).permitAll()
                        // Ghi nhận lượt truy cập — cho cả khách chưa đăng nhập.
                        .requestMatchers(HttpMethod.POST, "/api/analytics/visit").permitAll()
                        .requestMatchers("/oauth2/**", "/login/oauth2/**").permitAll()
                        .anyRequest().authenticated()
                )

                // 7. OAuth2 Logic
                .oauth2Login(oauth2 -> oauth2
                        .successHandler((request, response, authentication) -> {
                            OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
                            String email = oAuth2User.getAttribute("email");
                            String name = oAuth2User.getAttribute("name");
                            String picture = oAuth2User.getAttribute("picture");

                            customUserDetailsService.processOAuthPostLogin(email, name, picture);
                            User user = userRepository.findByEmail(email).orElseThrow();

                            UserDetails userDetails = org.springframework.security.core.userdetails.User
                                    .withUsername(user.getEmail())
                                    .password("")
                                    .authorities(authentication.getAuthorities())
                                    .build();

                            Map<String, Object> claims = new HashMap<>();
                            claims.put("userId", user.getUserId());
                            claims.put("roleId", user.getRoleId());

                            String familyId = java.util.UUID.randomUUID().toString();
                            String jti = java.util.UUID.randomUUID().toString();
                            refreshTokenStore.createFamily(user.getUserId(), familyId, jti);

                            String accessToken = jwtService.generateToken(userDetails, claims);
                            String refreshToken = jwtService.generateRefreshToken(userDetails, familyId, jti);

                            String sameSiteAttr = isProduction ? "; SameSite=None; Secure" : "; SameSite=Lax";
                            String accessCookie = "accessToken=" + accessToken
                                    + "; HttpOnly; Path=/; Max-Age=" + (24 * 60 * 60)
                                    + sameSiteAttr;
                            String refreshCookie = "refreshToken=" + refreshToken
                                    + "; HttpOnly; Path=/api/auth/refresh; Max-Age=" + (7 * 24 * 60 * 60)
                                    + sameSiteAttr;

                            response.addHeader("Set-Cookie", accessCookie);
                            response.addHeader("Set-Cookie", refreshCookie);
                            SecurityContextHolder.clearContext();
                            response.sendRedirect(frontendOrigin + "/oauth2/redirect");
                        })
                );

        // 8. Filters order — rate-limit chạy trước JWT để chặn brute-force ngay từ đầu.
        http.addFilterBefore(authRateLimitFilter, UsernamePasswordAuthenticationFilter.class);
        http.addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);
        http.addFilterAfter(new CsrfCookieFilter(), BasicAuthenticationFilter.class);

        return http.build();
    }

    private CookieCsrfTokenRepository customCsrfTokenRepository(boolean isProduction) {
        CookieCsrfTokenRepository repository = CookieCsrfTokenRepository.withHttpOnlyFalse();
        if (!isProduction) {
            // Localhost: Chấp nhận HTTP, dùng Lax
            repository.setCookieCustomizer(cookie -> cookie.secure(false).sameSite("Lax"));
        } else {
            // Production: Bắt buộc HTTPS, dùng None cho Cross-site
            repository.setCookieCustomizer(cookie -> cookie.secure(true).sameSite("None"));
        }
        return repository;
    }

    private static final class CsrfCookieFilter extends OncePerRequestFilter {
        @Override
        protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
                throws ServletException, IOException {
            CsrfToken csrfToken = (CsrfToken) request.getAttribute(CsrfToken.class.getName());
            if (null != csrfToken) {
                csrfToken.getToken(); 
            }
            filterChain.doFilter(request, response);
        }
    }

    @Bean
    public AuthenticationProvider authenticationProvider(PasswordEncoder passwordEncoder) {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
        provider.setUserDetailsService(customUserDetailsService);
        provider.setPasswordEncoder(passwordEncoder);
        return provider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration cfg) throws Exception {
        return cfg.getAuthenticationManager();
    }

    @Bean
    public CorsFilter corsFilter(@Value("${app.frontend.origin}") String origin) {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowCredentials(true);
        config.setAllowedOrigins(List.of(origin));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("Authorization", "Content-Type", "X-XSRF-TOKEN", "Accept", "X-Guest-Session"));
        config.setExposedHeaders(List.of("Set-Cookie", "Authorization", "X-XSRF-TOKEN"));

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return new CorsFilter(source);
    }
}