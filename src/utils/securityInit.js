// Security Initialization and Configuration

// Security Configuration
export const SECURITY_CONFIG = {
  SESSION_TIMEOUT: 120 * 60 * 1000, // 120 minutes (2 hours) - increased from 30 minutes
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION: 15 * 60 * 1000, // 15 minutes
  PASSWORD_MIN_LENGTH: 8,
  TOKEN_REFRESH_INTERVAL: 5 * 60 * 1000, // 5 minutes
};

// Initialize security features
export const initializeSecurity = () => {
  try {
    console.log('🔒 Initializing security features...');

    // Initialize session management
    initializeSessionManagement();

    // Initialize rate limiting
    initializeRateLimiting();

    // Initialize input validation
    initializeInputValidation();

    console.log('✅ Security features initialized successfully');
    return true;
  } catch (error) {
    console.error('❌ Failed to initialize security features:', error);
    return false;
  }
};

// Session Management
const initializeSessionManagement = () => {
  // Set up session timeout
  let sessionTimeout;

  const resetSessionTimeout = () => {
    clearTimeout(sessionTimeout);

    // Only set timeout if user is logged in
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const secureSession = localStorage.getItem('secureSession');

    if (isLoggedIn && secureSession) {
      sessionTimeout = setTimeout(() => {
        console.log('🔒 Session expired, logging out...');

        // Use AuthContext logout instead of clearing localStorage directly
        // This will be handled by the AuthContext's session management
        const event = new CustomEvent('sessionExpired');
        window.dispatchEvent(event);

        // Fallback: redirect to register if AuthContext doesn't handle it
        setTimeout(() => {
          if (localStorage.getItem('isLoggedIn') === 'true') {
            console.log('🔄 Fallback logout - redirecting to register');
            localStorage.clear();
            sessionStorage.clear();
            window.location.href = '/register';
          }
        }, 1000);
      }, SECURITY_CONFIG.SESSION_TIMEOUT);
    }
  };

  // Reset timeout on user activity
  const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
  events.forEach(event => {
    document.addEventListener(event, resetSessionTimeout, true);
  });

  // Start initial timeout
  resetSessionTimeout();

  // Listen for login/logout events to manage session timeout
  window.addEventListener('storage', (e) => {
    if (e.key === 'isLoggedIn' || e.key === 'secureSession') {
      resetSessionTimeout();
    }
  });
};

// Rate Limiting
const initializeRateLimiting = () => {
  const rateLimitMap = new Map();

  window.rateLimiter = {
    check: (key, limit, window) => {
      const now = Date.now();
      const userRequests = rateLimitMap.get(key) || [];

      // Remove old requests outside the window
      const validRequests = userRequests.filter(time => now - time < window);

      if (validRequests.length >= limit) {
        return false;
      }

      validRequests.push(now);
      rateLimitMap.set(key, validRequests);
      return true;
    },

    clear: (key) => {
      rateLimitMap.delete(key);
    }
  };
};

// Input Validation
const initializeInputValidation = () => {
  // Global input sanitization
  window.sanitizeInput = (input) => {
    if (typeof input !== 'string') return input;

    return input
      .trim()
      .replace(/[<>]/g, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+=/gi, '')
      .replace(/script/gi, '');
  };
};

// Get security status
export const getSecurityStatus = () => {
  return {
    sessionTimeout: SECURITY_CONFIG.SESSION_TIMEOUT,
    maxLoginAttempts: SECURITY_CONFIG.MAX_LOGIN_ATTEMPTS,
    lockoutDuration: SECURITY_CONFIG.LOCKOUT_DURATION,
    passwordMinLength: SECURITY_CONFIG.PASSWORD_MIN_LENGTH,
    tokenRefreshInterval: SECURITY_CONFIG.TOKEN_REFRESH_INTERVAL,
  };
};

// Security health check
export const performSecurityHealthCheck = () => {
  const status = {
    sessionManagement: true,
    rateLimiting: true,
    inputValidation: true,
    overall: true
  };

  try {
    // Check if session management is working
    if (!window.rateLimiter) {
      status.rateLimiting = false;
      status.overall = false;
    }

    // Check if input validation is working
    if (!window.sanitizeInput) {
      status.inputValidation = false;
      status.overall = false;
    }

    return status;
  } catch (error) {
    console.error('Security health check failed:', error);
    return {
      sessionManagement: false,
      rateLimiting: false,
      inputValidation: false,
      overall: false
    };
  }
}; 