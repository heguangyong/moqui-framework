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
import java.io.File;
import java.nio.file.Files;
import java.security.KeyFactory;
import java.security.PrivateKey;
import java.security.PublicKey;
import java.security.SecureRandom;
import java.security.interfaces.RSAPrivateKey;
import java.security.interfaces.RSAPublicKey;
import java.security.spec.PKCS8EncodedKeySpec;
import java.security.spec.X509EncodedKeySpec;
import java.time.Instant;
import java.util.Base64;
import java.util.Date;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Enterprise-grade JWT Utility Class
 * Supports configurable parameters, multiple algorithms, and enhanced security
 */
public class JwtUtil {
    private static final Logger logger = LoggerFactory.getLogger(JwtUtil.class);

    // Configuration keys
    private static final String CONFIG_JWT_SECRET = "moqui.jwt.secret";
    private static final String CONFIG_JWT_ISSUER = "moqui.jwt.issuer";
    private static final String CONFIG_JWT_AUDIENCE = "moqui.jwt.audience";
    private static final String CONFIG_JWT_ALGORITHM = "moqui.jwt.algorithm";
    private static final String CONFIG_ACCESS_EXPIRE_MINUTES = "moqui.jwt.access.expire.minutes";
    private static final String CONFIG_REFRESH_EXPIRE_DAYS = "moqui.jwt.refresh.expire.days";
    private static final String CONFIG_IP_VALIDATION = "moqui.jwt.ip.validation.enabled";
    private static final String CONFIG_AUDIT_ENABLED = "moqui.jwt.audit.enabled";
    private static final String CONFIG_DEBUG_LOGGING = "moqui.jwt.debug.logging";
    private static final String CONFIG_PRIVATE_KEY_PATH = "moqui.jwt.private.key.path";
    private static final String CONFIG_PUBLIC_KEY_PATH = "moqui.jwt.public.key.path";
    private static final String CONFIG_RATE_LIMIT_ENABLED = "moqui.jwt.rate.limit.enabled";
    private static final String CONFIG_RATE_LIMIT_RPM = "moqui.jwt.rate.limit.requests.per.minute";

    // Default values (fallback)
    private static final String DEFAULT_ALGORITHM = "HS256";
    private static final String DEFAULT_ISSUER = "moqui";
    private static final String DEFAULT_AUDIENCE = "moqui-app";
    private static final long DEFAULT_ACCESS_EXPIRE_MINUTES = 60; // 1 hour
    private static final long DEFAULT_REFRESH_EXPIRE_DAYS = 30;   // 30 days

    // Token撤销黑名单
    private static final Set<String> revokedTokens = ConcurrentHashMap.newKeySet();

    // Rate limiting
    private static final AtomicLong requestCount = new AtomicLong(0);
    private static volatile long lastResetTime = System.currentTimeMillis();

    // Cached algorithm instance
    private static volatile Algorithm cachedAlgorithm = null;
    private static volatile long algorithmCacheTime = 0;
    private static final long ALGORITHM_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

    /**
     * Get JWT configuration parameter with fallback
     */
    private static String getConfigValue(String key, String defaultValue) {
        try {
            // Try system property first
            String value = System.getProperty(key);
            if (value != null && !value.trim().isEmpty()) {
                return value.trim();
            }

            // Fallback to default value for now
            // TODO: Implement proper Moqui configuration access
            return defaultValue;
        } catch (Exception e) {
            logger.warn("Error getting config value for {}: {}", key, e.getMessage());
            return defaultValue;
        }
    }

    /**
     * Get JWT secret from configuration
     */
    private static String getJwtSecret() {
        String secret = getConfigValue(CONFIG_JWT_SECRET, "dev_jwt_secret_key_for_development_only_change_in_production_12345");
        if (secret == null || secret.isEmpty()) {
            logger.error("JWT secret not configured! Set '{}' in configuration.", CONFIG_JWT_SECRET);
            throw new IllegalStateException("JWT secret must be configured");
        }
        return secret;
    }

    /**
     * Get JWT issuer from configuration
     */
    private static String getJwtIssuer() {
        return getConfigValue(CONFIG_JWT_ISSUER, DEFAULT_ISSUER);
    }

    /**
     * Get JWT audience from configuration
     */
    private static String getJwtAudience() {
        return getConfigValue(CONFIG_JWT_AUDIENCE, DEFAULT_AUDIENCE);
    }

    /**
     * Get JWT algorithm from configuration
     */
    private static String getJwtAlgorithm() {
        return getConfigValue(CONFIG_JWT_ALGORITHM, DEFAULT_ALGORITHM);
    }

    /**
     * Get algorithm instance with caching and support for multiple algorithms
     */
    private static Algorithm getAlgorithm() {
        long currentTime = System.currentTimeMillis();
        if (cachedAlgorithm != null && (currentTime - algorithmCacheTime) < ALGORITHM_CACHE_DURATION) {
            return cachedAlgorithm;
        }

        synchronized (JwtUtil.class) {
            // Double-check locking
            if (cachedAlgorithm != null && (currentTime - algorithmCacheTime) < ALGORITHM_CACHE_DURATION) {
                return cachedAlgorithm;
            }

            String algorithmName = getJwtAlgorithm();
            Algorithm algorithm;

            try {
                switch (algorithmName.toUpperCase()) {
                    case "HS256":
                        algorithm = Algorithm.HMAC256(getJwtSecret());
                        break;
                    case "HS384":
                        algorithm = Algorithm.HMAC384(getJwtSecret());
                        break;
                    case "HS512":
                        algorithm = Algorithm.HMAC512(getJwtSecret());
                        break;
                    case "RS256":
                        RSAPublicKey publicKey = loadRSAPublicKey();
                        RSAPrivateKey privateKey = loadRSAPrivateKey();
                        algorithm = Algorithm.RSA256(publicKey, privateKey);
                        break;
                    case "RS384":
                        RSAPublicKey publicKey384 = loadRSAPublicKey();
                        RSAPrivateKey privateKey384 = loadRSAPrivateKey();
                        algorithm = Algorithm.RSA384(publicKey384, privateKey384);
                        break;
                    case "RS512":
                        RSAPublicKey publicKey512 = loadRSAPublicKey();
                        RSAPrivateKey privateKey512 = loadRSAPrivateKey();
                        algorithm = Algorithm.RSA512(publicKey512, privateKey512);
                        break;
                    default:
                        logger.warn("Unsupported algorithm: {}, falling back to HS256", algorithmName);
                        algorithm = Algorithm.HMAC256(getJwtSecret());
                        break;
                }

                cachedAlgorithm = algorithm;
                algorithmCacheTime = currentTime;
                if (isDebugLoggingEnabled()) {
                    logger.debug("JWT algorithm initialized: {}", algorithmName);
                }
                return algorithm;
            } catch (Exception e) {
                logger.error("Failed to initialize JWT algorithm: {}", algorithmName, e);
                throw new RuntimeException("JWT algorithm initialization failed", e);
            }
        }
    }

    /**
     * Load RSA public key from file
     */
    private static RSAPublicKey loadRSAPublicKey() throws Exception {
        String keyPath = getConfigValue(CONFIG_PUBLIC_KEY_PATH, null);
        if (keyPath == null || keyPath.isEmpty()) {
            throw new IllegalStateException("RSA public key path not configured");
        }

        byte[] keyBytes = Files.readAllBytes(new File(keyPath).toPath());
        String keyContent = new String(keyBytes)
                .replace("-----BEGIN PUBLIC KEY-----", "")
                .replace("-----END PUBLIC KEY-----", "")
                .replaceAll("\\s", "");

        byte[] decoded = Base64.getDecoder().decode(keyContent);
        X509EncodedKeySpec spec = new X509EncodedKeySpec(decoded);
        KeyFactory keyFactory = KeyFactory.getInstance("RSA");
        return (RSAPublicKey) keyFactory.generatePublic(spec);
    }

    /**
     * Load RSA private key from file
     */
    private static RSAPrivateKey loadRSAPrivateKey() throws Exception {
        String keyPath = getConfigValue(CONFIG_PRIVATE_KEY_PATH, null);
        if (keyPath == null || keyPath.isEmpty()) {
            throw new IllegalStateException("RSA private key path not configured");
        }

        byte[] keyBytes = Files.readAllBytes(new File(keyPath).toPath());
        String keyContent = new String(keyBytes)
                .replace("-----BEGIN PRIVATE KEY-----", "")
                .replace("-----END PRIVATE KEY-----", "")
                .replace("-----BEGIN RSA PRIVATE KEY-----", "")
                .replace("-----END RSA PRIVATE KEY-----", "")
                .replaceAll("\\s", "");

        byte[] decoded = Base64.getDecoder().decode(keyContent);
        PKCS8EncodedKeySpec spec = new PKCS8EncodedKeySpec(decoded);
        KeyFactory keyFactory = KeyFactory.getInstance("RSA");
        return (RSAPrivateKey) keyFactory.generatePrivate(spec);
    }

    /**
     * Get access token expiration time in milliseconds
     */
    private static long getAccessTokenExpireTime() {
        try {
            String configTime = getConfigValue(CONFIG_ACCESS_EXPIRE_MINUTES, String.valueOf(DEFAULT_ACCESS_EXPIRE_MINUTES));
            return Long.parseLong(configTime) * 60 * 1000; // Convert to milliseconds
        } catch (NumberFormatException e) {
            logger.warn("Invalid access token expire minutes config, using default: {}", DEFAULT_ACCESS_EXPIRE_MINUTES);
            return DEFAULT_ACCESS_EXPIRE_MINUTES * 60 * 1000;
        }
    }

    /**
     * Get refresh token expiration time in milliseconds
     */
    private static long getRefreshTokenExpireTime() {
        try {
            String configTime = getConfigValue(CONFIG_REFRESH_EXPIRE_DAYS, String.valueOf(DEFAULT_REFRESH_EXPIRE_DAYS));
            return Long.parseLong(configTime) * 24 * 60 * 60 * 1000L; // Convert to milliseconds
        } catch (NumberFormatException e) {
            logger.warn("Invalid refresh token expire days config, using default: {}", DEFAULT_REFRESH_EXPIRE_DAYS);
            return DEFAULT_REFRESH_EXPIRE_DAYS * 24 * 60 * 60 * 1000L;
        }
    }

    /**
     * Check if IP validation is enabled
     */
    private static boolean isIpValidationEnabled() {
        return "true".equalsIgnoreCase(getConfigValue(CONFIG_IP_VALIDATION, "false"));
    }

    /**
     * Check if audit logging is enabled
     */
    private static boolean isAuditEnabled() {
        return "true".equalsIgnoreCase(getConfigValue(CONFIG_AUDIT_ENABLED, "true"));
    }

    /**
     * Check if debug logging is enabled
     */
    private static boolean isDebugLoggingEnabled() {
        return "true".equalsIgnoreCase(getConfigValue(CONFIG_DEBUG_LOGGING, "false"));
    }

    /**
     * Check if rate limiting is enabled
     */
    private static boolean isRateLimitEnabled() {
        return "true".equalsIgnoreCase(getConfigValue(CONFIG_RATE_LIMIT_ENABLED, "false"));
    }

    /**
     * Get rate limit requests per minute
     */
    private static long getRateLimitRpm() {
        try {
            return Long.parseLong(getConfigValue(CONFIG_RATE_LIMIT_RPM, "60"));
        } catch (NumberFormatException e) {
            logger.warn("Invalid rate limit RPM config, using default: 60");
            return 60;
        }
    }

    /**
     * Rate limiting check
     */
    private static void checkRateLimit() {
        if (!isRateLimitEnabled()) {
            return;
        }

        long currentTime = System.currentTimeMillis();
        long timeDiff = currentTime - lastResetTime;

        // Reset counter every minute
        if (timeDiff >= 60000) {
            synchronized (JwtUtil.class) {
                if (currentTime - lastResetTime >= 60000) {
                    requestCount.set(0);
                    lastResetTime = currentTime;
                }
            }
        }

        long currentCount = requestCount.incrementAndGet();
        long limit = getRateLimitRpm();

        if (currentCount > limit) {
            logger.warn("JWT rate limit exceeded: {} requests per minute (limit: {})", currentCount, limit);
            throw new RuntimeException("Rate limit exceeded for JWT operations");
        }
    }

    /**
     * Audit log for JWT operations
     */
    private static void auditLog(String operation, String userId, String clientIp, boolean success, String message) {
        if (!isAuditEnabled()) {
            return;
        }

        try {
            ExecutionContext ec = Moqui.getExecutionContext();
            if (ec != null) {
                // Log to Moqui audit system
                java.util.Map<String, Object> auditParams = new java.util.HashMap<>();
                auditParams.put("auditDate", Instant.now());
                auditParams.put("userId", userId != null ? userId : "unknown");
                auditParams.put("artifactName", "JWT." + operation);
                auditParams.put("artifactType", "AT_SERVICE");
                auditParams.put("actionDetail", message);
                auditParams.put("clientIpAddress", clientIp);
                auditParams.put("wasError", success ? "N" : "Y");

                ec.getService().async().name("create", "moqui.security.AuditLog")
                    .parameters(auditParams)
                    .call();
            }
        } catch (Exception e) {
            logger.warn("Failed to write JWT audit log", e);
        }
    }

    /**
     * Generate Token Pair with enterprise features
     * @param userId User ID
     * @param clientIp Client IP address
     * @return TokenPair containing access and refresh tokens
     */
    public static TokenPair generateTokenPair(String userId, String clientIp) {
        checkRateLimit();

        try {
            long currentTime = System.currentTimeMillis();
            long accessExpireTime = getAccessTokenExpireTime();
            long refreshExpireTime = getRefreshTokenExpireTime();
            String issuer = getJwtIssuer();
            String audience = getJwtAudience();

            Algorithm algorithm = getAlgorithm();

            // Create access token with enhanced claims
            String accessToken = JWT.create()
                    .withSubject(userId)
                    .withIssuer(issuer)
                    .withAudience(audience)
                    .withClaim("userId", userId)
                    .withClaim("type", "access")
                    .withClaim("clientIp", clientIp)
                    .withClaim("tokenId", generateTokenId())
                    .withIssuedAt(new Date(currentTime))
                    .withExpiresAt(new Date(currentTime + accessExpireTime))
                    .withNotBefore(new Date(currentTime))
                    .sign(algorithm);

            // Create refresh token with enhanced claims
            String refreshToken = JWT.create()
                    .withSubject(userId)
                    .withIssuer(issuer)
                    .withAudience(audience)
                    .withClaim("userId", userId)
                    .withClaim("type", "refresh")
                    .withClaim("clientIp", clientIp)
                    .withClaim("tokenId", generateTokenId())
                    .withIssuedAt(new Date(currentTime))
                    .withExpiresAt(new Date(currentTime + refreshExpireTime))
                    .withNotBefore(new Date(currentTime))
                    .sign(algorithm);

            auditLog("generateTokenPair", userId, clientIp, true, "Token pair generated successfully");

            if (isDebugLoggingEnabled()) {
                logger.debug("Generated token pair for user: {} with algorithm: {}", userId, getJwtAlgorithm());
            }

            return new TokenPair(accessToken, refreshToken, accessExpireTime / 1000);

        } catch (Exception e) {
            auditLog("generateTokenPair", userId, clientIp, false, "Token generation failed: " + e.getMessage());
            logger.error("Failed to generate token pair for user: " + userId, e);
            throw new RuntimeException("Token generation failed", e);
        }
    }

    /**
     * Generate unique token ID
     */
    private static String generateTokenId() {
        return Base64.getUrlEncoder().withoutPadding()
                .encodeToString(String.valueOf(System.nanoTime()).getBytes());
    }

    /**
     * Validate Token with enterprise security features
     * @param token JWT token
     * @param clientIp Client IP address
     * @return ValidationResult validation result
     */
    public static ValidationResult validateToken(String token, String clientIp) {
        checkRateLimit();

        try {
            // Check if token is in revocation blacklist
            if (revokedTokens.contains(token)) {
                auditLog("validateToken", null, clientIp, false, "Token is revoked");
                if (isDebugLoggingEnabled()) {
                    logger.debug("Token validation failed: revoked");
                }
                return new ValidationResult(false, null, "Token has been revoked");
            }

            Algorithm algorithm = getAlgorithm();
            String issuer = getJwtIssuer();
            String audience = getJwtAudience();

            // Verify and decode token with issuer and audience validation
            DecodedJWT jwt = JWT.require(algorithm)
                    .withIssuer(issuer)
                    .withAudience(audience)
                    .build()
                    .verify(token);

            String userId = jwt.getClaim("userId").asString();
            String tokenClientIp = jwt.getClaim("clientIp").asString();
            String tokenType = jwt.getClaim("type").asString();

            // Validate token type
            if (tokenType == null) {
                auditLog("validateToken", userId, clientIp, false, "Invalid token type");
                return new ValidationResult(false, userId, "Invalid token type");
            }

            // IP validation (if enabled)
            if (isIpValidationEnabled() && clientIp != null && tokenClientIp != null) {
                if (!clientIp.equals(tokenClientIp)) {
                    auditLog("validateToken", userId, clientIp, false,
                        String.format("IP mismatch: token IP=%s, request IP=%s", tokenClientIp, clientIp));
                    logger.warn("IP mismatch for user {}: token IP={}, request IP={}", userId, tokenClientIp, clientIp);
                    return new ValidationResult(false, userId, "IP address mismatch");
                }
            }

            // Validate not-before claim
            Date notBefore = jwt.getNotBefore();
            if (notBefore != null && new Date().before(notBefore)) {
                auditLog("validateToken", userId, clientIp, false, "Token not yet valid (nbf check failed)");
                return new ValidationResult(false, userId, "Token not yet valid");
            }

            auditLog("validateToken", userId, clientIp, true, "Token validation successful");

            if (isDebugLoggingEnabled()) {
                logger.debug("Token validation successful for user: {} with algorithm: {}", userId, getJwtAlgorithm());
            }

            return new ValidationResult(true, userId, "Valid token");

        } catch (TokenExpiredException e) {
            auditLog("validateToken", null, clientIp, false, "Token expired");
            if (isDebugLoggingEnabled()) {
                logger.debug("Token validation failed: expired", e);
            }
            return new ValidationResult(false, null, "Token expired");
        } catch (Exception e) {
            auditLog("validateToken", null, clientIp, false, "Token validation failed: " + e.getMessage());
            if (isDebugLoggingEnabled()) {
                logger.debug("Token validation failed", e);
            }
            return new ValidationResult(false, null, "Invalid token");
        }
    }

    /**
     * Create access token (API compatibility)
     * @param userId User ID
     * @return JWT access token
     */
    public static String createAccessToken(String userId) {
        return generateTokenPair(userId, null).getAccessToken();
    }

    /**
     * Verify token (API compatibility)
     * @param token JWT token
     * @return whether valid
     */
    public static boolean verify(String token) {
        return validateToken(token, null).isValid();
    }

    /**
     * Revoke token (add to blacklist) with enhanced security
     * @param token token string
     * @return whether successfully revoked
     */
    public static boolean revokeToken(String token) {
        if (token == null || token.trim().isEmpty()) {
            return false;
        }

        String trimmedToken = token.trim();
        boolean added = revokedTokens.add(trimmedToken);

        if (added) {
            try {
                // Extract userId for audit logging
                DecodedJWT jwt = JWT.decode(trimmedToken);
                String userId = jwt.getClaim("userId").asString();
                auditLog("revokeToken", userId, null, true, "Token revoked successfully");

                if (isDebugLoggingEnabled()) {
                    logger.debug("Token revoked for user: {}", userId);
                }
            } catch (Exception e) {
                auditLog("revokeToken", null, null, true, "Token revoked (user extraction failed)");
                if (isDebugLoggingEnabled()) {
                    logger.debug("Token revoked but failed to extract userId", e);
                }
            }
        }

        return added;
    }

    /**
     * Refresh access token using refresh token with enhanced security
     * @param refreshToken refresh token
     * @param clientIp client IP address
     * @return new TokenPair, null if failed
     */
    public static TokenPair refreshAccessToken(String refreshToken, String clientIp) {
        checkRateLimit();

        try {
            // Validate refresh token
            ValidationResult result = validateToken(refreshToken, clientIp);
            if (!result.isValid()) {
                auditLog("refreshAccessToken", null, clientIp, false, "Invalid refresh token: " + result.getMessage());
                logger.warn("Invalid refresh token: {}", result.getMessage());
                return null;
            }

            // Check token type
            DecodedJWT decodedJWT = JWT.decode(refreshToken);
            String tokenType = decodedJWT.getClaim("type").asString();
            if (!"refresh".equals(tokenType)) {
                auditLog("refreshAccessToken", result.getUserId(), clientIp, false, "Invalid token type for refresh: " + tokenType);
                logger.warn("Invalid token type for refresh: {}", tokenType);
                return null;
            }

            String userId = result.getUserId();

            // Check if refresh token rotation is enabled
            boolean rotationEnabled = "true".equalsIgnoreCase(getConfigValue("moqui.jwt.refresh.rotation.enabled", "false"));
            if (rotationEnabled) {
                // Revoke the used refresh token
                revokeToken(refreshToken);
            }

            // Generate new token pair
            TokenPair newTokenPair = generateTokenPair(userId, clientIp);
            auditLog("refreshAccessToken", userId, clientIp, true, "Access token refreshed successfully");
            return newTokenPair;

        } catch (Exception e) {
            auditLog("refreshAccessToken", null, clientIp, false, "Token refresh failed: " + e.getMessage());
            logger.error("Failed to refresh access token", e);
            return null;
        }
    }

    /**
     * Get user ID from token with enhanced error handling
     * @param token token string
     * @return user ID
     */
    public static String getUserId(String token) {
        try {
            DecodedJWT jwt = JWT.decode(token);
            return jwt.getClaim("userId").asString();
        } catch (JWTDecodeException e) {
            if (isDebugLoggingEnabled()) {
                logger.debug("Failed to decode token for getUserId", e);
            }
            return null;
        }
    }

    /**
     * Check if token is expired with enhanced error handling
     * @param token token string
     * @return true if expired, false if not expired
     */
    public static boolean isTokenExpired(String token) {
        try {
            DecodedJWT jwt = JWT.decode(token);
            Date expiresAt = jwt.getExpiresAt();
            return expiresAt != null && expiresAt.before(new Date());
        } catch (Exception e) {
            if (isDebugLoggingEnabled()) {
                logger.debug("Failed to check token expiration", e);
            }
            return true; // Consider invalid tokens as expired
        }
    }

    /**
     * Get token remaining time in seconds
     * @param token token string
     * @return remaining seconds, -1 if expired or invalid
     */
    public static long getTokenRemainingTime(String token) {
        try {
            DecodedJWT jwt = JWT.decode(token);
            Date expiresAt = jwt.getExpiresAt();
            if (expiresAt == null) return -1;

            long remaining = (expiresAt.getTime() - System.currentTimeMillis()) / 1000;
            return Math.max(remaining, -1);
        } catch (Exception e) {
            if (isDebugLoggingEnabled()) {
                logger.debug("Failed to get token remaining time", e);
            }
            return -1;
        }
    }

    /**
     * Legacy method for compatibility
     * @param userId User ID
     * @return JWT token
     */
    public static String sign(String userId) {
        return createAccessToken(userId);
    }

    /**
     * Clean up expired revoked tokens (scheduled cleanup task)
     * This method should be called periodically to prevent memory leaks
     */
    public static void cleanupRevokedTokens() {
        if (revokedTokens.isEmpty()) {
            return;
        }

        int initialSize = revokedTokens.size();
        int cleanedCount = 0;

        // Clean up expired tokens from the revocation list
        revokedTokens.removeIf(token -> {
            try {
                return isTokenExpired(token);
            } catch (Exception e) {
                // Remove invalid tokens
                return true;
            }
        });

        cleanedCount = initialSize - revokedTokens.size();
        if (cleanedCount > 0 && isDebugLoggingEnabled()) {
            logger.debug("Cleaned up {} expired tokens from revocation list. Remaining: {}", cleanedCount, revokedTokens.size());
        }
    }

    /**
     * Get algorithm information for monitoring
     */
    public static String getAlgorithmInfo() {
        return String.format("Algorithm: %s, Issuer: %s, Audience: %s",
                getJwtAlgorithm(), getJwtIssuer(), getJwtAudience());
    }

    /**
     * Get security configuration summary
     */
    public static String getSecurityInfo() {
        return String.format("IP Validation: %s, Rate Limiting: %s, Audit: %s, Debug: %s",
                isIpValidationEnabled(), isRateLimitEnabled(), isAuditEnabled(), isDebugLoggingEnabled());
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