// API Configuration
const API_CONFIG = {
    // Backend API URL - can be configured via environment variables
    BACKEND_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',

    // API endpoints
    ENDPOINTS: {
        USER: '/api/user',
        PUBLIC: '/api',
        CSRF: {
            TOKEN: '/api/csrf/token',
            REFRESH: '/api/csrf/refresh',
            VALIDATE: '/api/csrf/validate'
        }
    },

    // Request configuration
    REQUEST_CONFIG: {
        TIMEOUT: 10000,
        WITH_CREDENTIALS: true,
        RETRY_ATTEMPTS: 3,
        RETRY_DELAY: 1000
    },

    // CORS configuration
    CORS: {
        ALLOWED_ORIGINS: [
            'http://localhost:5173',
            'http://localhost:5174',
            'http://localhost:5175',
            'http://localhost:3000'
        ]
    }
};

// Helper function to get full API URL
export const getApiUrl = (endpoint) => {
    return `${API_CONFIG.BACKEND_URL}${endpoint}`;
};

// Helper function to check if current origin is allowed
export const isOriginAllowed = () => {
    const currentOrigin = window.location.origin;
    return API_CONFIG.CORS.ALLOWED_ORIGINS.includes(currentOrigin);
};

// Helper function to get API client configuration
export const getApiClientConfig = () => {
    return {
        timeout: API_CONFIG.REQUEST_CONFIG.TIMEOUT,
        withCredentials: API_CONFIG.REQUEST_CONFIG.WITH_CREDENTIALS
    };
};

export default API_CONFIG; 