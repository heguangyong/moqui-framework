package org.moqui.jwt;

import org.moqui.Moqui;
import org.moqui.entity.EntityValue;
import org.moqui.context.ExecutionContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.servlet.http.HttpServletRequest;

public class JwtAuthService {
    private static final Logger logger = LoggerFactory.getLogger(JwtAuthService.class);

    /**
     * 用户登录并生成JWT token对
     * @param username 用户名
     * @param password 密码
     * @param request HTTP请求对象（用于获取IP地址）
     * @return token对，失败返回null
     */
    public static JwtUtil.TokenPair login(String username, String password, HttpServletRequest request) {
        ExecutionContext ec = Moqui.getExecutionContext();

        try {
            // 使用Moqui内置的登录方法
            boolean loggedIn = ec.getUser().loginUser(username, password);

            if (loggedIn) {
                // 登录成功，生成JWT token对
                String userId = ec.getUser().getUserId();
                String clientIp = getClientIpAddress(request);
                JwtUtil.TokenPair tokenPair = JwtUtil.generateTokenPair(userId, clientIp);

                logger.info("User {} logged in successfully, tokens generated", username);
                return tokenPair;
            } else {
                // 登录失败
                logger.warn("Login failed for user: {}", username);
                return null;
            }
        } catch (Exception e) {
            logger.error("Login error for user: " + username, e);
            return null;
        } finally {
            if (ec != null) ec.destroy();
        }
    }

    /**
     * 兼容旧接口的登录方法
     * @param username 用户名
     * @param password 密码
     * @return access token字符串
     * @deprecated 建议使用login(username, password, request)方法
     */
    @Deprecated
    public static String login(String username, String password) {
        JwtUtil.TokenPair tokenPair = login(username, password, null);
        return tokenPair != null ? tokenPair.getAccessToken() : null;
    }

    /**
     * 验证JWT token
     * @param token JWT token
     * @param request HTTP请求对象（用于获取IP地址）
     * @return 验证结果
     */
    public static JwtUtil.ValidationResult verifyToken(String token, HttpServletRequest request) {
        String clientIp = getClientIpAddress(request);
        return JwtUtil.validateToken(token, clientIp);
    }

    /**
     * 验证JWT token（兼容旧接口）
     * @param token JWT token
     * @return 用户ID，验证失败返回null
     * @deprecated 建议使用verifyToken(token, request)方法
     */
    @Deprecated
    public static String verifyToken(String token) {
        JwtUtil.ValidationResult result = JwtUtil.validateToken(token, null);
        return result.isValid() ? result.getUserId() : null;
    }

    /**
     * 刷新访问令牌
     * @param refreshToken 刷新令牌
     * @param request HTTP请求对象
     * @return 新的令牌对，失败返回null
     */
    public static JwtUtil.TokenPair refreshToken(String refreshToken, HttpServletRequest request) {
        String clientIp = getClientIpAddress(request);
        JwtUtil.TokenPair newTokenPair = JwtUtil.refreshAccessToken(refreshToken, clientIp);

        if (newTokenPair != null) {
            logger.debug("Token refreshed successfully for IP: {}", clientIp);
        } else {
            logger.warn("Token refresh failed for IP: {}", clientIp);
        }

        return newTokenPair;
    }

    /**
     * 退出登录（撤销token）
     * @param token 要撤销的token
     * @return 是否成功撤销
     */
    public static boolean logout(String token) {
        if (token == null || token.trim().isEmpty()) {
            return false;
        }

        boolean revoked = JwtUtil.revokeToken(token);
        if (revoked) {
            logger.info("User token revoked successfully");
        }

        return revoked;
    }

    /**
     * 获取客户端IP地址
     * @param request HTTP请求对象
     * @return 客户端IP地址
     */
    private static String getClientIpAddress(HttpServletRequest request) {
        if (request == null) {
            return null;
        }

        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty() && !"unknown".equalsIgnoreCase(xForwardedFor)) {
            // 取第一个IP地址
            return xForwardedFor.split(",")[0].trim();
        }

        String xRealIP = request.getHeader("X-Real-IP");
        if (xRealIP != null && !xRealIP.isEmpty() && !"unknown".equalsIgnoreCase(xRealIP)) {
            return xRealIP;
        }

        return request.getRemoteAddr();
    }
    
    /**
     * 根据用户ID获取用户信息
     * @param userId 用户ID
     * @return 用户信息
     */
    public static EntityValue getUserInfo(String userId) {
        ExecutionContext ec = Moqui.getExecutionContext();
        
        try {
            return ec.getEntity().find("moqui.security.UserAccount")
                    .condition("userId", userId).disableAuthz().one();
        } finally {
            if (ec != null) ec.destroy();
        }
    }
}