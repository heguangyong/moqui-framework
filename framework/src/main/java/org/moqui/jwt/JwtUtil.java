package org.moqui.jwt;

import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.exceptions.JWTDecodeException;
import com.auth0.jwt.exceptions.TokenExpiredException;
import com.auth0.jwt.interfaces.DecodedJWT;
import org.moqui.Moqui;
import org.moqui.context.ExecutionContext;
import org.moqui.context.ExecutionContextFactory;
import org.moqui.entity.EntityValue;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.servlet.http.HttpServletRequest;
import java.security.SecureRandom;
import java.util.Date;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

public class JwtUtil {
    private static final Logger logger = LoggerFactory.getLogger(JwtUtil.class);

    // Token 过期时间配置
    private static final long ACCESS_TOKEN_EXPIRE_TIME = 60 * 60 * 1000; // 1小时
    private static final long REFRESH_TOKEN_EXPIRE_TIME = 30 * 24 * 60 * 60 * 1000L; // 30天

    // Token撤销黑名单
    private static final Set<String> revokedTokens = ConcurrentHashMap.newKeySet();

    /**
     * 获取JWT密钥，支持配置化
     */
    private static String getJwtSecret() {
        // 从系统属性获取
        String systemSecret = System.getProperty("moqui.jwt.secret");
        if (systemSecret != null && !systemSecret.trim().isEmpty()) {
            return systemSecret;
        }

        // 从环境变量获取
        String envSecret = System.getenv("MOQUI_JWT_SECRET");
        if (envSecret != null && !envSecret.trim().isEmpty()) {
            return envSecret;
        }

        // 默认密钥（生产环境应配置）
        logger.warn("Using default JWT secret. Please configure 'moqui.jwt.secret' system property in production!");
        return "moqui_jwt_default_secret_change_in_production";
    }

    /**
     * 获取访问令牌过期时间配置
     */
    private static long getAccessTokenExpireTime() {
        String configTime = System.getProperty("moqui.jwt.access.expire.minutes", "60");
        try {
            return Long.parseLong(configTime) * 60 * 1000; // 转换为毫秒
        } catch (NumberFormatException e) {
            logger.warn("Invalid jwt access token expire minutes config: " + configTime, e);
        }
        return ACCESS_TOKEN_EXPIRE_TIME;
    }

    /**
     * 获取刷新令牌过期时间配置
     */
    private static long getRefreshTokenExpireTime() {
        String configTime = System.getProperty("moqui.jwt.refresh.expire.days", "30");
        try {
            return Long.parseLong(configTime) * 24 * 60 * 60 * 1000L; // 转换为毫秒
        } catch (NumberFormatException e) {
            logger.warn("Invalid jwt refresh token expire days config: " + configTime, e);
        }
        return REFRESH_TOKEN_EXPIRE_TIME;
    }

    /**
     * 生成Token对（访问令牌+刷新令牌）
     * @param userId 用户ID
     * @param clientIp 客户端IP地址
     * @return TokenPair包含访问令牌和刷新令牌
     */
    public static TokenPair generateTokenPair(String userId, String clientIp) {
        try {
            String secret = getJwtSecret();
            long currentTime = System.currentTimeMillis();
            long accessExpireTime = getAccessTokenExpireTime();
            long refreshExpireTime = getRefreshTokenExpireTime();

            Algorithm algorithm = Algorithm.HMAC256(secret);

            // 创建访问令牌
            String accessToken = JWT.create()
                    .withSubject(userId)
                    .withClaim("userId", userId)
                    .withClaim("type", "access")
                    .withClaim("clientIp", clientIp)
                    .withIssuedAt(new Date(currentTime))
                    .withExpiresAt(new Date(currentTime + accessExpireTime))
                    .sign(algorithm);

            // 创建刷新令牌
            String refreshToken = JWT.create()
                    .withSubject(userId)
                    .withClaim("userId", userId)
                    .withClaim("type", "refresh")
                    .withClaim("clientIp", clientIp)
                    .withIssuedAt(new Date(currentTime))
                    .withExpiresAt(new Date(currentTime + refreshExpireTime))
                    .sign(algorithm);

            logger.debug("Generated token pair for user: {}", userId);
            return new TokenPair(accessToken, refreshToken, accessExpireTime / 1000);

        } catch (Exception e) {
            logger.error("Failed to generate token pair for user: " + userId, e);
            throw new RuntimeException("Token generation failed", e);
        }
    }

    /**
     * 验证Token有效性
     * @param token JWT token
     * @param clientIp 客户端IP地址
     * @return ValidationResult 验证结果
     */
    public static ValidationResult validateToken(String token, String clientIp) {
        try {
            // 检查是否在黑名单中
            if (revokedTokens.contains(token)) {
                logger.debug("Token is revoked");
                return new ValidationResult(false, null, "Token has been revoked");
            }

            String secret = getJwtSecret();
            Algorithm algorithm = Algorithm.HMAC256(secret);

            // 验证并解码token
            DecodedJWT jwt = JWT.require(algorithm).build().verify(token);

            String userId = jwt.getClaim("userId").asString();
            String tokenClientIp = jwt.getClaim("clientIp").asString();

            // IP验证（如果启用）
            if (isIpValidationEnabled() && clientIp != null && tokenClientIp != null) {
                if (!clientIp.equals(tokenClientIp)) {
                    logger.warn("IP mismatch for user {}: token IP={}, request IP={}", userId, tokenClientIp, clientIp);
                    return new ValidationResult(false, userId, "IP address mismatch");
                }
            }

            logger.debug("Token validation successful for user: {}", userId);
            return new ValidationResult(true, userId, "Valid token");

        } catch (TokenExpiredException e) {
            logger.debug("Token expired", e);
            return new ValidationResult(false, null, "Token expired");
        } catch (Exception e) {
            logger.debug("Token validation failed", e);
            return new ValidationResult(false, null, "Invalid token");
        }
    }

    /**
     * 创建访问令牌（API兼容性）
     * @param userId 用户ID
     * @return JWT access token
     */
    public static String createAccessToken(String userId) {
        return generateTokenPair(userId, null).getAccessToken();
    }

    /**
     * 验证token（API兼容性）
     * @param token JWT token
     * @return 是否有效
     */
    public static boolean verify(String token) {
        return validateToken(token, null).isValid();
    }

    /**
     * 检查是否启用IP验证
     */
    private static boolean isIpValidationEnabled() {
        String enabled = System.getProperty("moqui.jwt.ip.validation.enabled", "false");
        return "true".equalsIgnoreCase(enabled);
    }

    /**
     * 撤销token（添加到黑名单）
     * @param token token字符串
     * @return 是否成功撤销
     */
    public static boolean revokeToken(String token) {
        if (token == null || token.trim().isEmpty()) {
            return false;
        }
        boolean added = revokedTokens.add(token.trim());
        logger.debug("Token revoked: {}", added);
        return added;
    }

    /**
     * 使用刷新令牌获取新的访问令牌
     * @param refreshToken 刷新令牌
     * @param clientIp 客户端IP地址
     * @return 新的TokenPair，如果失败返回null
     */
    public static TokenPair refreshAccessToken(String refreshToken, String clientIp) {
        try {
            // 验证刷新令牌
            ValidationResult result = validateToken(refreshToken, clientIp);
            if (!result.isValid()) {
                logger.warn("Invalid refresh token: {}", result.getMessage());
                return null;
            }

            // 检查令牌类型
            DecodedJWT decodedJWT = JWT.decode(refreshToken);
            String tokenType = decodedJWT.getClaim("type").asString();
            if (!"refresh".equals(tokenType)) {
                logger.warn("Invalid token type for refresh: {}", tokenType);
                return null;
            }

            String userId = result.getUserId();
            return generateTokenPair(userId, clientIp);

        } catch (Exception e) {
            logger.error("Failed to refresh access token", e);
            return null;
        }
    }

    /**
     * 获取token中的用户ID
     * @param token token字符串
     * @return 用户ID
     */
    public static String getUserId(String token) {
        try {
            DecodedJWT jwt = JWT.decode(token);
            return jwt.getClaim("userId").asString();
        } catch (JWTDecodeException e) {
            logger.debug("Failed to decode token for getUserId", e);
            return null;
        }
    }

    /**
     * 检查token是否过期
     * @param token token字符串
     * @return true表示已过期，false表示未过期
     */
    public static boolean isTokenExpired(String token) {
        try {
            DecodedJWT jwt = JWT.decode(token);
            Date expiresAt = jwt.getExpiresAt();
            return expiresAt != null && expiresAt.before(new Date());
        } catch (Exception e) {
            logger.debug("Failed to check token expiration", e);
            return true;
        }
    }

    /**
     * 兼容旧接口的sign方法
     * @param userId 用户ID
     * @return JWT token
     */
    public static String sign(String userId) {
        return createAccessToken(userId);
    }

    /**
     * 获取token剩余时间（秒）
     * @param token token字符串
     * @return 剩余秒数，-1表示已过期或无效
     */
    public static long getTokenRemainingTime(String token) {
        try {
            DecodedJWT jwt = JWT.decode(token);
            Date expiresAt = jwt.getExpiresAt();
            if (expiresAt == null) return -1;

            long remaining = (expiresAt.getTime() - System.currentTimeMillis()) / 1000;
            return Math.max(remaining, -1);
        } catch (Exception e) {
            logger.debug("Failed to get token remaining time", e);
            return -1;
        }
    }

    /**
     * 清理过期的撤销令牌（定期清理任务）
     * 建议定期调用以防止内存泄漏
     */
    public static void cleanupRevokedTokens() {
        // 这里可以实现更复杂的清理逻辑，比如基于时间的清理
        // 暂时保持简单实现
        logger.debug("Revoked tokens cleanup triggered. Current size: {}", revokedTokens.size());
    }

    /**
     * Token对类，包含访问令牌和刷新令牌
     */
    public static class TokenPair {
        private final String accessToken;
        private final String refreshToken;
        private final long expiresIn;

        public TokenPair(String accessToken, String refreshToken, long expiresIn) {
            this.accessToken = accessToken;
            this.refreshToken = refreshToken;
            this.expiresIn = expiresIn;
        }

        public String getAccessToken() {
            return accessToken;
        }

        public String getRefreshToken() {
            return refreshToken;
        }

        public long getExpiresIn() {
            return expiresIn;
        }
    }

    /**
     * Token验证结果类
     */
    public static class ValidationResult {
        private final boolean valid;
        private final String userId;
        private final String message;

        public ValidationResult(boolean valid, String userId, String message) {
            this.valid = valid;
            this.userId = userId;
            this.message = message;
        }

        public boolean isValid() {
            return valid;
        }

        public String getUserId() {
            return userId;
        }

        public String getMessage() {
            return message;
        }
    }
}