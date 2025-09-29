package org.moqui.jwt;

import org.moqui.Moqui;
import org.moqui.context.ExecutionContext;
import org.moqui.context.UserFacade;
import org.moqui.entity.EntityValue;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpSession;
import java.util.List;
import java.util.Map;

/**
 * 统一认证服务
 * JWT单一认证模式，简化权限模型
 */
public class UnifiedAuthService {
    private static final Logger logger = LoggerFactory.getLogger(UnifiedAuthService.class);

    /**
     * 认证结果枚举
     */
    public enum AuthenticationResult {
        SUCCESS_JWT("JWT认证成功"),
        FAILED_INVALID_TOKEN("无效的Token"),
        FAILED_EXPIRED_TOKEN("Token已过期"),
        FAILED_NO_AUTH("未提供认证信息"),
        FAILED_INVALID_CREDENTIALS("无效的凭据"),
        FAILED_UNKNOWN("未知错误");

        private final String message;

        AuthenticationResult(String message) {
            this.message = message;
        }

        public String getMessage() {
            return message;
        }

        public boolean isSuccess() {
            return this == SUCCESS_JWT;
        }
    }

    /**
     * 认证结果对象
     */
    public static class AuthResult {
        private final AuthenticationResult result;
        private final String userId;
        private final String username;
        private final String message;

        public AuthResult(AuthenticationResult result, String userId, String username, String message) {
            this.result = result;
            this.userId = userId;
            this.username = username;
            this.message = message;
        }

        public AuthenticationResult getResult() { return result; }
        public String getUserId() { return userId; }
        public String getUsername() { return username; }
        public String getMessage() { return message; }
        public boolean isAuthenticated() { return result.isSuccess(); }

        @Override
        public String toString() {
            return "AuthResult{" +
                    "result=" + result +
                    ", userId='" + userId + '\'' +
                    ", username='" + username + '\'' +
                    ", message='" + message + '\'' +
                    '}';
        }
    }

    /**
     * 统一认证入口 - JWT单一认证模式
     * 只支持JWT认证，简化权限模型
     *
     * @param request HTTP请求对象
     * @return 认证结果
     */
    public static AuthResult authenticate(HttpServletRequest request) {
        if (request == null) {
            return new AuthResult(AuthenticationResult.FAILED_NO_AUTH, null, null, "Request is null");
        }

        // 只使用JWT认证
        AuthResult jwtResult = authenticateWithJWT(request);
        if (jwtResult.isAuthenticated()) {
            logger.debug("JWT authentication successful for user: {}", jwtResult.getUserId());
            return jwtResult;
        }

        // JWT认证失败，直接返回失败结果
        logger.debug("JWT authentication failed for request from: {}", request.getRemoteAddr());
        return new AuthResult(AuthenticationResult.FAILED_NO_AUTH, null, null, "JWT authentication required");
    }

    /**
     * JWT认证
     */
    public static AuthResult authenticateWithJWT(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return new AuthResult(AuthenticationResult.FAILED_NO_AUTH, null, null, "No JWT token provided");
        }

        String token = authHeader.substring(7); // 移除 "Bearer " 前缀
        JwtUtil.ValidationResult validation = JwtAuthService.verifyToken(token, request);

        if (validation.isValid()) {
            String userId = validation.getUserId();
            String username = getUsernameByUserId(userId);
            return new AuthResult(AuthenticationResult.SUCCESS_JWT, userId, username, "JWT authentication successful");
        } else {
            AuthenticationResult result = validation.getMessage().contains("expired") ?
                AuthenticationResult.FAILED_EXPIRED_TOKEN : AuthenticationResult.FAILED_INVALID_TOKEN;
            return new AuthResult(result, null, null, validation.getMessage());
        }
    }

    /**
     * JWT认证 - WebSocket HandshakeRequest版本
     */
    public static AuthResult authenticateWithJWT(javax.websocket.server.HandshakeRequest request) {
        Map<String, List<String>> headers = request.getHeaders();
        List<String> authHeaders = headers.get("Authorization");

        if (authHeaders == null || authHeaders.isEmpty()) {
            return new AuthResult(AuthenticationResult.FAILED_NO_AUTH, null, null, "No JWT token provided");
        }

        String authHeader = authHeaders.get(0);
        if (!authHeader.startsWith("Bearer ")) {
            return new AuthResult(AuthenticationResult.FAILED_NO_AUTH, null, null, "Invalid JWT token format");
        }

        String token = authHeader.substring(7); // 移除 "Bearer " 前缀
        JwtUtil.ValidationResult validation = JwtUtil.validateToken(token, null);

        if (validation.isValid()) {
            String userId = validation.getUserId();
            String username = getUsernameByUserId(userId);
            return new AuthResult(AuthenticationResult.SUCCESS_JWT, userId, username, "JWT authentication successful");
        } else {
            AuthenticationResult result = validation.getMessage().contains("expired") ?
                AuthenticationResult.FAILED_EXPIRED_TOKEN : AuthenticationResult.FAILED_INVALID_TOKEN;
            return new AuthResult(result, null, null, validation.getMessage());
        }
    }

    /**
     * API Key认证（UserLoginKey）
     * @deprecated 已废弃，系统已切换为JWT单一认证模式
     */
    @Deprecated
    private static AuthResult authenticateWithApiKey(HttpServletRequest request) {
        logger.warn("API Key authentication is deprecated. Please use JWT authentication.");
        return new AuthResult(AuthenticationResult.FAILED_NO_AUTH, null, null, "API Key authentication disabled - use JWT");
    }

    /**
     * Session认证
     * @deprecated 已废弃，系统已切换为JWT单一认证模式
     */
    @Deprecated
    private static AuthResult authenticateWithSession(HttpServletRequest request) {
        logger.warn("Session authentication is deprecated. Please use JWT authentication.");
        return new AuthResult(AuthenticationResult.FAILED_NO_AUTH, null, null, "Session authentication disabled - use JWT");
    }

    /**
     * 从请求中获取API Key
     * @deprecated 已废弃，系统已切换为JWT单一认证模式
     */
    @Deprecated
    private static String getApiKeyFromRequest(HttpServletRequest request) {
        logger.warn("getApiKeyFromRequest() is deprecated. System now uses JWT-only authentication.");
        return null;
    }

    /**
     * 根据用户ID获取用户名
     */
    private static String getUsernameByUserId(String userId) {
        if (userId == null || userId.trim().isEmpty()) {
            return null;
        }

        ExecutionContext ec = Moqui.getExecutionContext();
        if (ec == null) {
            logger.warn("No ExecutionContext available, cannot lookup username for userId: " + userId);
            return userId; // Return userId as fallback since we can't access the database
        }

        try {
            EntityValue userAccount = ec.getEntity().find("moqui.security.UserAccount")
                    .condition("userId", userId)
                    .disableAuthz()
                    .one();

            return userAccount != null ? userAccount.getString("username") : userId; // Return userId as fallback
        } catch (Exception e) {
            logger.warn("Failed to get username for userId: " + userId, e);
            return userId; // Return userId as fallback
        }
    }

    /**
     * 检查认证是否为指定类型
     */
    public static boolean isAuthenticatedWith(HttpServletRequest request, AuthenticationResult expectedType) {
        AuthResult result = authenticate(request);
        return result.getResult() == expectedType;
    }

    /**
     * 仅检查是否已认证（不关心认证类型）
     */
    public static boolean isAuthenticated(HttpServletRequest request) {
        AuthResult result = authenticate(request);
        return result.isAuthenticated();
    }

    /**
     * 获取当前认证用户的用户ID
     */
    public static String getCurrentUserId(HttpServletRequest request) {
        AuthResult result = authenticate(request);
        return result.isAuthenticated() ? result.getUserId() : null;
    }

    /**
     * 获取当前认证用户的用户名
     */
    public static String getCurrentUsername(HttpServletRequest request) {
        AuthResult result = authenticate(request);
        return result.isAuthenticated() ? result.getUsername() : null;
    }

    /**
     * 强制用户重新认证（撤销JWT Token）
     */
    public static void forceReAuthentication(HttpServletRequest request) {
        // 撤销JWT Token（如果存在）
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            JwtUtil.revokeToken(token);
            logger.info("JWT token revoked for forced re-authentication from: {}", request.getRemoteAddr());
        } else {
            logger.info("No JWT token found for forced re-authentication from: {}", request.getRemoteAddr());
        }
    }
}