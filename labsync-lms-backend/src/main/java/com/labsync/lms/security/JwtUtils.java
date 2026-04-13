package com.labsync.lms.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;
import java.security.Key;
import java.util.Date;

/**
 * JwtUtils — handles JWT creation, parsing, and validation.
 *
 * Token lifecycle:
 * 1. On login → generateJwtToken(authentication)
 * 2. On request → validateJwtToken(token) + getUsernameFromJwtToken(token)
 */
@Component
public class JwtUtils {
    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(JwtUtils.class);
    @Value("${app.jwt.secret}")
    private String jwtSecret;
    @Value("${app.jwt.expiration-ms}")
    private int jwtExpirationMs;

    // ── Token Generation
    /**
     * Generates a signed JWT for the authenticated user.
     * Subject = username; expiry = now + jwtExpirationMs.
     */
    public String generateJwtToken(Authentication authentication) {
        UserDetailsImpl userPrincipal = (UserDetailsImpl) authentication.getPrincipal();
        return Jwts.builder().setSubject(userPrincipal.getUsername()).setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + jwtExpirationMs))
                .signWith(getSigningKey(), SignatureAlgorithm.HS256).compact();
    }

    // ── Token Parsing
    /**
     * Extracts the username (subject) from a valid JWT.
     */
    public String getUsernameFromJwtToken(String token) {
        return Jwts.parserBuilder().setSigningKey(getSigningKey()).build().parseClaimsJws(token).getBody().getSubject();
    }

    // ── Token Validation
    /**
     * Returns true if the token is well-formed, signed correctly, and not expired.
     * Logs the specific failure reason for debugging.
     */
    public boolean validateJwtToken(String authToken) {
        try {
            Jwts.parserBuilder().setSigningKey(getSigningKey()).build().parseClaimsJws(authToken);
            return true;
        } catch (MalformedJwtException e) {
            log.error("Invalid JWT token: {}", e.getMessage());
        } catch (ExpiredJwtException e) {
            log.error("JWT token is expired: {}", e.getMessage());
        } catch (UnsupportedJwtException e) {
            log.error("JWT token is unsupported: {}", e.getMessage());
        } catch (IllegalArgumentException e) {
            log.error("JWT claims string is empty: {}", e.getMessage());
        }
        return false;
    }

    // ── Key Derivation
    private Key getSigningKey() {
        byte[] keyBytes = Decoders.BASE64.decode(java.util.Base64.getEncoder().encodeToString(jwtSecret.getBytes()));
        return Keys.hmacShaKeyFor(keyBytes);
    }
}
