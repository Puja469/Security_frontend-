// API Security Middleware for Thrift Store Application
import axios from 'axios';
import {
    ActivityLogger,
    clearSecureSession,
    generateCSRFToken,
    getSecureSession,
    getSecurityHeaders,
    RateLimiter,
    sanitizeInput
} from './security';

// Create axios instance with security defaults
const secureApiClient = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'https://localhost:3000/api',
    timeout: 30000, // 30 seconds
    headers: {
        'Content-Type': 'application/json',
        ...getSecurityHeaders(),
    },
});

// Request interceptor for security
secureApiClient.interceptors.request.use(
    (config) => {
        // Add CSRF token
        const csrfToken = generateCSRFToken();
        config.headers['X-CSRF-Token'] = csrfToken;

        // Add session token if available
        const session = getSecureSession();
        if (session?.sessionId) {
            config.headers['X-Session-ID'] = session.sessionId;
        }

        // Add user agent
        config.headers['User-Agent'] = navigator.userAgent;

        // Add timestamp for request tracking
        config.headers['X-Request-Timestamp'] = Date.now().toString();

        // Sanitize request data
        if (config.data) {
            config.data = sanitizeRequestData(config.data);
        }

        if (config.params) {
            config.params = sanitizeRequestData(config.params);
        }

        // Rate limiting check
        const identifier = session?.userId || 'anonymous';
        const rateLimit = RateLimiter.checkRateLimit(identifier);
        if (!rateLimit.allowed) {
            return Promise.reject(new Error('Rate limit exceeded. Please wait before making another request.'));
        }

        // Log API request
        ActivityLogger.logActivity(session?.userId, 'api_request', {
            method: config.method?.toUpperCase(),
            url: config.url,
            timestamp: new Date().toISOString(),
        });

        return config;
    },
    (error) => {
        console.error('Request interceptor error:', error);
        return Promise.reject(error);
    }
);

// Response interceptor for security
secureApiClient.interceptors.response.use(
    (response) => {
        // Log successful API response
        const session = getSecureSession();
        ActivityLogger.logActivity(session?.userId, 'api_response_success', {
            method: response.config.method?.toUpperCase(),
            url: response.config.url,
            status: response.status,
            timestamp: new Date().toISOString(),
        });

        // Validate response headers for security
        validateSecurityHeaders(response.headers);

        return response;
    },
    (error) => {
        // Log failed API response
        const session = getSecureSession();
        ActivityLogger.logActivity(session?.userId, 'api_response_error', {
            method: error.config?.method?.toUpperCase(),
            url: error.config?.url,
            status: error.response?.status,
            error: error.message,
            timestamp: new Date().toISOString(),
        });

        // Handle specific security errors
        if (error.response?.status === 401) {
            // Unauthorized - clear session and redirect to login
            clearSecureSession();
            window.location.href = '/register';
        } else if (error.response?.status === 403) {
            // Forbidden - insufficient permissions
            console.error('Access denied: Insufficient permissions');
        } else if (error.response?.status === 429) {
            // Too many requests
            console.error('Rate limit exceeded');
        }

        return Promise.reject(error);
    }
);

// Sanitize request data
const sanitizeRequestData = (data) => {
    if (typeof data === 'object' && data !== null) {
        const sanitized = {};
        for (const [key, value] of Object.entries(data)) {
            if (typeof value === 'string') {
                sanitized[key] = sanitizeInput(value);
            } else if (typeof value === 'object' && value !== null) {
                sanitized[key] = sanitizeRequestData(value);
            } else {
                sanitized[key] = value;
            }
        }
        return sanitized;
    }
    return data;
};

// Validate security headers in response
const validateSecurityHeaders = (headers) => {
    const requiredHeaders = [
        'X-Content-Type-Options',
        'X-Frame-Options',
        'X-XSS-Protection',
    ];

    for (const header of requiredHeaders) {
        if (!headers[header.toLowerCase()]) {
            console.warn(`Missing security header: ${header}`);
        }
    }
};

// Secure API methods
export const secureApi = {
    // GET request with security
    get: async (url, config = {}) => {
        return secureApiClient.get(url, {
            ...config,
            headers: {
                ...config.headers,
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0',
            },
        });
    },

    // POST request with security
    post: async (url, data = {}, config = {}) => {
        return secureApiClient.post(url, data, {
            ...config,
            headers: {
                ...config.headers,
                'X-Requested-With': 'XMLHttpRequest',
            },
        });
    },

    // PUT request with security
    put: async (url, data = {}, config = {}) => {
        return secureApiClient.put(url, data, {
            ...config,
            headers: {
                ...config.headers,
                'X-Requested-With': 'XMLHttpRequest',
            },
        });
    },

    // DELETE request with security
    delete: async (url, config = {}) => {
        return secureApiClient.delete(url, {
            ...config,
            headers: {
                ...config.headers,
                'X-Requested-With': 'XMLHttpRequest',
            },
        });
    },

    // PATCH request with security
    patch: async (url, data = {}, config = {}) => {
        return secureApiClient.patch(url, data, {
            ...config,
            headers: {
                ...config.headers,
                'X-Requested-With': 'XMLHttpRequest',
            },
        });
    },
};

// File upload with security
export const secureFileUpload = async (url, file, config = {}) => {
    // Validate file
    if (!file || !(file instanceof File)) {
        throw new Error('Invalid file provided');
    }

    // Check file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
        throw new Error('File size exceeds 5MB limit');
    }

    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
        throw new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed');
    }

    const formData = new FormData();
    formData.append('file', file);

    return secureApiClient.post(url, formData, {
        ...config,
        headers: {
            ...config.headers,
            'Content-Type': 'multipart/form-data',
        },
    });
};

// WebSocket security wrapper
export const secureWebSocket = (url, options = {}) => {
    const session = getSecureSession();
    const wsUrl = new URL(url);

    // Add security parameters
    if (session?.sessionId) {
        wsUrl.searchParams.append('sessionId', session.sessionId);
    }

    wsUrl.searchParams.append('csrf', generateCSRFToken());
    wsUrl.searchParams.append('timestamp', Date.now().toString());

    const ws = new WebSocket(wsUrl.toString(), options);

    // Add security event handlers
    ws.addEventListener('open', () => {
        ActivityLogger.logActivity(session?.userId, 'websocket_connected', {
            url: url,
            timestamp: new Date().toISOString(),
        });
    });

    ws.addEventListener('error', (error) => {
        ActivityLogger.logActivity(session?.userId, 'websocket_error', {
            url: url,
            error: error.message,
            timestamp: new Date().toISOString(),
        });
    });

    ws.addEventListener('close', (event) => {
        ActivityLogger.logActivity(session?.userId, 'websocket_disconnected', {
            url: url,
            code: event.code,
            reason: event.reason,
            timestamp: new Date().toISOString(),
        });
    });

    return ws;
};

// Security utilities for API calls
export const apiSecurity = {
    // Validate API response
    validateResponse: (response) => {
        if (!response || typeof response !== 'object') {
            throw new Error('Invalid response format');
        }

        // Check for required fields
        if (response.data === undefined) {
            throw new Error('Response missing data field');
        }

        return response;
    },

    // Sanitize API response data
    sanitizeResponse: (data) => {
        if (typeof data === 'string') {
            return sanitizeInput(data);
        }

        if (typeof data === 'object' && data !== null) {
            const sanitized = {};
            for (const [key, value] of Object.entries(data)) {
                sanitized[key] = apiSecurity.sanitizeResponse(value);
            }
            return sanitized;
        }

        return data;
    },

    // Check if response contains sensitive data
    checkSensitiveData: (data) => {
        const sensitiveFields = ['password', 'token', 'secret', 'key', 'ssn', 'credit_card'];

        const checkObject = (obj) => {
            for (const [key, value] of Object.entries(obj)) {
                if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
                    console.warn(`Sensitive data detected in response: ${key}`);
                }
                if (typeof value === 'object' && value !== null) {
                    checkObject(value);
                }
            }
        };

        if (typeof data === 'object' && data !== null) {
            checkObject(data);
        }
    },

    // Generate secure request ID
    generateRequestId: () => {
        return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    },

    // Add request tracking
    addRequestTracking: (config) => {
        const requestId = apiSecurity.generateRequestId();
        config.headers = config.headers || {};
        config.headers['X-Request-ID'] = requestId;
        return config;
    },
};

// Export the secure client
export default secureApiClient; 