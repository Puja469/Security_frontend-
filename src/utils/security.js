// Security Utilities for Thrift Store Application
import CryptoJS from 'crypto-js';

// Password Security Configuration
export const PASSWORD_CONFIG = {
    MIN_LENGTH: 8,
    MAX_LENGTH: 128,
    REQUIRE_UPPERCASE: true,
    REQUIRE_LOWERCASE: true,
    REQUIRE_NUMBERS: true,
    REQUIRE_SPECIAL_CHARS: true,
    MIN_SPECIAL_CHARS: 1,
    MIN_NUMBERS: 1,
    PASSWORD_EXPIRY_DAYS: 90,
    MAX_RECENT_PASSWORDS: 5,
    BRUTE_FORCE_MAX_ATTEMPTS: 5,
    BRUTE_FORCE_LOCKOUT_MINUTES: 15,
    SESSION_TIMEOUT_MINUTES: 120, // Increased from 30 to 120 minutes (2 hours)
    MFA_REQUIRED: true,
    RATE_LIMIT_REQUESTS: 100,
    RATE_LIMIT_WINDOW_MS: 15 * 60 * 1000, // 15 minutes
};

// OTP Security Configuration (More lenient for user experience)
export const OTP_CONFIG = {
    MAX_ATTEMPTS: 10, // Increased from 5 to 10
    LOCKOUT_MINUTES: 5, // Reduced from 15 to 5 minutes
    RATE_LIMIT_REQUESTS: 20, // Reduced from 100 to 20
    RATE_LIMIT_WINDOW_MS: 10 * 60 * 1000, // 10 minutes window
    OTP_EXPIRY_MINUTES: 10, // OTP expires in 10 minutes
};

// Password Strength Assessment
export const assessPasswordStrength = (password) => {
    const checks = {
        length: password.length >= PASSWORD_CONFIG.MIN_LENGTH,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        numbers: /\d/.test(password),
        specialChars: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
        noCommonPatterns: !/(123|abc|qwe|password|admin|user)/i.test(password),
        noRepeatingChars: !/(.)\1{2,}/.test(password),
        noSequentialChars: !/(abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz|012|123|234|345|456|567|678|789)/i.test(password),
    };

    const score = Object.values(checks).filter(Boolean).length;
    const maxScore = Object.keys(checks).length;

    let strength = 'weak';
    let color = 'red';
    let message = '';

    if (score >= maxScore) {
        strength = 'very-strong';
        color = 'green';
        message = 'Excellent! Your password is very secure.';
    } else if (score >= maxScore * 0.8) {
        strength = 'strong';
        color = 'green';
        message = 'Good! Your password is strong.';
    } else if (score >= maxScore * 0.6) {
        strength = 'medium';
        color = 'yellow';
        message = 'Fair. Consider adding more complexity.';
    } else if (score >= maxScore * 0.4) {
        strength = 'weak';
        color = 'orange';
        message = 'Weak. Please improve your password.';
    } else {
        strength = 'very-weak';
        color = 'red';
        message = 'Very weak. Please choose a stronger password.';
    }

    return {
        score,
        maxScore,
        strength,
        color,
        message,
        checks,
        isValid: score >= maxScore * 0.6 && password.length >= PASSWORD_CONFIG.MIN_LENGTH,
    };
};

// Password Validation
export const validatePassword = (password, confirmPassword = null) => {
    const errors = [];
    const strength = assessPasswordStrength(password);

    if (password.length < PASSWORD_CONFIG.MIN_LENGTH) {
        errors.push(`Password must be at least ${PASSWORD_CONFIG.MIN_LENGTH} characters long`);
    }

    if (password.length > PASSWORD_CONFIG.MAX_LENGTH) {
        errors.push(`Password must not exceed ${PASSWORD_CONFIG.MAX_LENGTH} characters`);
    }

    if (PASSWORD_CONFIG.REQUIRE_UPPERCASE && !/[A-Z]/.test(password)) {
        errors.push('Password must contain at least one uppercase letter');
    }

    if (PASSWORD_CONFIG.REQUIRE_LOWERCASE && !/[a-z]/.test(password)) {
        errors.push('Password must contain at least one lowercase letter');
    }

    if (PASSWORD_CONFIG.REQUIRE_NUMBERS && !/\d/.test(password)) {
        errors.push('Password must contain at least one number');
    }

    if (PASSWORD_CONFIG.REQUIRE_SPECIAL_CHARS && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
        errors.push('Password must contain at least one special character');
    }

    if (confirmPassword !== null && password !== confirmPassword) {
        errors.push('Passwords do not match');
    }

    return {
        isValid: errors.length === 0 && strength.isValid,
        errors,
        strength,
    };
};

// Encryption Utilities - Simplified for development
export const encryptData = (data, secretKey = import.meta.env.VITE_ENCRYPTION_KEY || 'thrift-store-secret-key') => {
    try {
        // For development, just return the data as JSON string
        return JSON.stringify(data);
    } catch (error) {
        console.error('Encryption error:', error);
        return JSON.stringify(data);
    }
};

export const decryptData = (encryptedData, secretKey = import.meta.env.VITE_ENCRYPTION_KEY || 'thrift-store-secret-key') => {
    try {
        // For development, just parse the JSON string
        return JSON.parse(encryptedData);
    } catch (error) {
        console.error('Decryption error:', error);
        // Try to return the original data if it's not encrypted
        try {
            return JSON.parse(encryptedData);
        } catch {
            return encryptedData;
        }
    }
};

// Hash Password (for client-side hashing before sending to server)
export const hashPassword = (password) => {
    return CryptoJS.SHA256(password).toString();
};

// Session Management - Simplified for development
export const createSecureSession = (userData) => {
    const expiresAt = new Date(Date.now() + PASSWORD_CONFIG.SESSION_TIMEOUT_MINUTES * 60 * 1000).toISOString();

    const sessionData = {
        userId: userData.userId,
        role: userData.role,
        email: userData.email,
        fname: userData.fname,
        createdAt: new Date().toISOString(),
        expiresAt: expiresAt,
        sessionId: generateSessionId(),
        lastActivity: new Date().toISOString(),
    };

    console.log('🔐 Creating secure session:', {
        userId: userData.userId,
        expiresAt: expiresAt,
        sessionTimeoutMinutes: PASSWORD_CONFIG.SESSION_TIMEOUT_MINUTES
    });

    // Store session data directly for development
    localStorage.setItem('secureSession', JSON.stringify(sessionData));

    return sessionData;
};

export const getSecureSession = () => {
    try {
        const sessionData = localStorage.getItem('secureSession');
        if (!sessionData) return null;

        const parsedSession = JSON.parse(sessionData);

        console.log('🔍 Session check:', {
            expiresAt: parsedSession.expiresAt,
            currentTime: new Date().toISOString(),
            isExpired: new Date(parsedSession.expiresAt) < new Date()
        });

        // Check if session has expired
        if (new Date(parsedSession.expiresAt) < new Date()) {
            console.log('❌ Session expired, clearing auth data');
            clearSecureSession();
            return null;
        }

        // Update last activity
        parsedSession.lastActivity = new Date().toISOString();
        localStorage.setItem('secureSession', JSON.stringify(parsedSession));

        return parsedSession;
    } catch (error) {
        console.error('Session retrieval error:', error);
        clearSecureSession();
        return null;
    }
};

export const clearSecureSession = () => {
    localStorage.removeItem('secureSession');
    // Don't remove token from localStorage since it's in HTTP-only cookie
    // localStorage.removeItem('token'); // REMOVED - token is in HTTP-only cookie
    localStorage.removeItem('userId');
    localStorage.removeItem('role');
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('email');
    localStorage.removeItem('fname');
    localStorage.removeItem('justLoggedIn');
};

// Brute Force Protection
export const BruteForceProtection = {
    attempts: new Map(),
    lockouts: new Map(),

    recordAttempt: (identifier) => {
        const now = Date.now();
        const attempts = BruteForceProtection.attempts.get(identifier) || [];

        // Remove attempts older than lockout window
        const recentAttempts = attempts.filter(
            timestamp => now - timestamp < PASSWORD_CONFIG.BRUTE_FORCE_LOCKOUT_MINUTES * 60 * 1000
        );

        recentAttempts.push(now);
        BruteForceProtection.attempts.set(identifier, recentAttempts);

        if (recentAttempts.length >= PASSWORD_CONFIG.BRUTE_FORCE_MAX_ATTEMPTS) {
            BruteForceProtection.lockouts.set(identifier, now);
            return { isLocked: true, remainingTime: PASSWORD_CONFIG.BRUTE_FORCE_LOCKOUT_MINUTES * 60 * 1000 };
        }

        return { isLocked: false, remainingAttempts: PASSWORD_CONFIG.BRUTE_FORCE_MAX_ATTEMPTS - recentAttempts.length };
    },

    isLocked: (identifier) => {
        const lockoutTime = BruteForceProtection.lockouts.get(identifier);
        if (!lockoutTime) return false;

        const now = Date.now();
        const lockoutDuration = PASSWORD_CONFIG.BRUTE_FORCE_LOCKOUT_MINUTES * 60 * 1000;

        if (now - lockoutTime >= lockoutDuration) {
            BruteForceProtection.lockouts.delete(identifier);
            BruteForceProtection.attempts.delete(identifier);
            return false;
        }

        return true;
    },

    getRemainingLockoutTime: (identifier) => {
        const lockoutTime = BruteForceProtection.lockouts.get(identifier);
        if (!lockoutTime) return 0;

        const now = Date.now();
        const lockoutDuration = PASSWORD_CONFIG.BRUTE_FORCE_LOCKOUT_MINUTES * 60 * 1000;
        const remaining = lockoutDuration - (now - lockoutTime);

        return Math.max(0, remaining);
    },

    clearAttempts: (identifier) => {
        BruteForceProtection.attempts.delete(identifier);
        BruteForceProtection.lockouts.delete(identifier);
    },
};

// OTP-Specific Brute Force Protection (More lenient)
export const OTPBruteForceProtection = {
    attempts: new Map(),
    lockouts: new Map(),

    recordAttempt: (identifier) => {
        const now = Date.now();
        const attempts = OTPBruteForceProtection.attempts.get(identifier) || [];

        // Remove attempts older than lockout window
        const recentAttempts = attempts.filter(
            timestamp => now - timestamp < OTP_CONFIG.LOCKOUT_MINUTES * 60 * 1000
        );

        recentAttempts.push(now);
        OTPBruteForceProtection.attempts.set(identifier, recentAttempts);

        if (recentAttempts.length >= OTP_CONFIG.MAX_ATTEMPTS) {
            OTPBruteForceProtection.lockouts.set(identifier, now);
            return { isLocked: true, remainingTime: OTP_CONFIG.LOCKOUT_MINUTES * 60 * 1000 };
        }

        return { isLocked: false, remainingAttempts: OTP_CONFIG.MAX_ATTEMPTS - recentAttempts.length };
    },

    isLocked: (identifier) => {
        const lockoutTime = OTPBruteForceProtection.lockouts.get(identifier);
        if (!lockoutTime) return false;

        const now = Date.now();
        const lockoutDuration = OTP_CONFIG.LOCKOUT_MINUTES * 60 * 1000;

        if (now - lockoutTime >= lockoutDuration) {
            OTPBruteForceProtection.lockouts.delete(identifier);
            OTPBruteForceProtection.attempts.delete(identifier);
            return false;
        }

        return true;
    },

    getRemainingLockoutTime: (identifier) => {
        const lockoutTime = OTPBruteForceProtection.lockouts.get(identifier);
        if (!lockoutTime) return 0;

        const now = Date.now();
        const lockoutDuration = OTP_CONFIG.LOCKOUT_MINUTES * 60 * 1000;
        const remaining = lockoutDuration - (now - lockoutTime);

        return Math.max(0, remaining);
    },

    clearAttempts: (identifier) => {
        OTPBruteForceProtection.attempts.delete(identifier);
        OTPBruteForceProtection.lockouts.delete(identifier);
    },
};

// Rate Limiting
export const RateLimiter = {
    requests: new Map(),

    checkRateLimit: (identifier) => {
        const now = Date.now();
        const windowStart = now - PASSWORD_CONFIG.RATE_LIMIT_WINDOW_MS;

        const userRequests = RateLimiter.requests.get(identifier) || [];
        const recentRequests = userRequests.filter(timestamp => timestamp > windowStart);

        if (recentRequests.length >= PASSWORD_CONFIG.RATE_LIMIT_REQUESTS) {
            return { allowed: false, remainingRequests: 0, resetTime: windowStart + PASSWORD_CONFIG.RATE_LIMIT_WINDOW_MS };
        }

        recentRequests.push(now);
        RateLimiter.requests.set(identifier, recentRequests);

        return {
            allowed: true,
            remainingRequests: PASSWORD_CONFIG.RATE_LIMIT_REQUESTS - recentRequests.length,
            resetTime: windowStart + PASSWORD_CONFIG.RATE_LIMIT_WINDOW_MS
        };
    },

    clearRequests: (identifier) => {
        RateLimiter.requests.delete(identifier);
    },
};

// OTP-Specific Rate Limiting (More lenient)
export const OTPRateLimiter = {
    requests: new Map(),

    checkRateLimit: (identifier) => {
        const now = Date.now();
        const windowStart = now - OTP_CONFIG.RATE_LIMIT_WINDOW_MS;

        const userRequests = OTPRateLimiter.requests.get(identifier) || [];
        const recentRequests = userRequests.filter(timestamp => timestamp > windowStart);

        if (recentRequests.length >= OTP_CONFIG.RATE_LIMIT_REQUESTS) {
            return { allowed: false, remainingRequests: 0, resetTime: windowStart + OTP_CONFIG.RATE_LIMIT_WINDOW_MS };
        }

        recentRequests.push(now);
        OTPRateLimiter.requests.set(identifier, recentRequests);

        return {
            allowed: true,
            remainingRequests: OTP_CONFIG.RATE_LIMIT_REQUESTS - recentRequests.length,
            resetTime: windowStart + OTP_CONFIG.RATE_LIMIT_WINDOW_MS
        };
    },

    clearRequests: (identifier) => {
        OTPRateLimiter.requests.delete(identifier);
    },
};

// Input Sanitization
export const sanitizeInput = (input) => {
    if (typeof input !== 'string') return input;

    return input
        .trim()
        .replace(/[<>]/g, '') // Remove potential HTML tags
        .replace(/javascript:/gi, '') // Remove javascript: protocol
        .replace(/on\w+=/gi, '') // Remove event handlers
        .replace(/script/gi, '') // Remove script tags
        .replace(/iframe/gi, ''); // Remove iframe tags
};

// XSS Prevention
export const escapeHtml = (text) => {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
};

// CSRF Token Generation
export const generateCSRFToken = () => {
    return CryptoJS.lib.WordArray.random(32).toString();
};

// Secure Token Generation
export const generateSecureToken = (length = 32) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};

// Session ID Generation
export const generateSessionId = () => {
    return CryptoJS.lib.WordArray.random(64).toString();
};

// Activity Logging
export const ActivityLogger = {
    logActivity: (userId, action, details = {}, ipAddress = null) => {
        const logEntry = {
            userId,
            action,
            details,
            ipAddress,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            sessionId: getSecureSession()?.sessionId || 'unknown',
        };

        // Store in localStorage for client-side logging
        const logs = JSON.parse(localStorage.getItem('activityLogs') || '[]');
        logs.push(logEntry);

        // Keep only last 1000 logs
        if (logs.length > 1000) {
            logs.splice(0, logs.length - 1000);
        }

        localStorage.setItem('activityLogs', JSON.stringify(logs));

        // Send to server for permanent storage
        // This would typically be done via API call
        console.log('Activity Log:', logEntry);

        return logEntry;
    },

    getActivityLogs: () => {
        return JSON.parse(localStorage.getItem('activityLogs') || '[]');
    },

    clearActivityLogs: () => {
        localStorage.removeItem('activityLogs');
    },
};

// Security Headers Helper
export const getSecurityHeaders = () => {
    return {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' ws: wss:;",
    };
};

// Role-Based Access Control (RBAC)
export const RBAC = {
    roles: {
        user: {
            permissions: ['read:own_profile', 'write:own_profile', 'read:products', 'create:products', 'update:own_products', 'delete:own_products'],
            inherits: []
        },
        admin: {
            permissions: ['read:all_profiles', 'write:all_profiles', 'read:all_products', 'create:products', 'update:all_products', 'delete:all_products', 'manage:users', 'manage:categories', 'view:analytics'],
            inherits: ['user']
        },
        moderator: {
            permissions: ['read:all_profiles', 'read:all_products', 'update:all_products', 'moderate:content'],
            inherits: ['user']
        }
    },

    hasPermission: (userRole, requiredPermission) => {
        const role = RBAC.roles[userRole];
        if (!role) return false;

        // Check direct permissions
        if (role.permissions.includes(requiredPermission)) {
            return true;
        }

        // Check inherited permissions
        for (const inheritedRole of role.inherits) {
            if (RBAC.hasPermission(inheritedRole, requiredPermission)) {
                return true;
            }
        }

        return false;
    },

    getPermissions: (userRole) => {
        const role = RBAC.roles[userRole];
        if (!role) return [];

        const permissions = new Set(role.permissions);

        // Add inherited permissions
        for (const inheritedRole of role.inherits) {
            const inheritedPermissions = RBAC.getPermissions(inheritedRole);
            inheritedPermissions.forEach(permission => permissions.add(permission));
        }

        return Array.from(permissions);
    }
};

// Security Validation
export const SecurityValidator = {
    validateEmail: (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email) && email.length <= 254;
    },

    validatePhone: (phone) => {
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
        return phoneRegex.test(phone.replace(/\s/g, ''));
    },

    validateName: (name) => {
        return name.length >= 2 && name.length <= 50 && /^[a-zA-Z\s]+$/.test(name);
    },

    validatePrice: (price) => {
        return !isNaN(price) && price >= 0 && price <= 999999.99;
    },

    validateImage: (file) => {
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        const maxSize = 5 * 1024 * 1024; // 5MB

        return allowedTypes.includes(file.type) && file.size <= maxSize;
    }
};

export default {
    PASSWORD_CONFIG,
    OTP_CONFIG,
    assessPasswordStrength,
    validatePassword,
    encryptData,
    decryptData,
    hashPassword,
    createSecureSession,
    getSecureSession,
    clearSecureSession,
    BruteForceProtection,
    RateLimiter,
    OTPBruteForceProtection,
    OTPRateLimiter,
    sanitizeInput,
    escapeHtml,
    generateCSRFToken,
    generateSecureToken,
    generateSessionId,
    ActivityLogger,
    getSecurityHeaders,
    RBAC,
    SecurityValidator,
}; 