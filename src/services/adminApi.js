// src/services/adminApi.js
import axios from 'axios';
import { getApiClientConfig } from '../config/apiConfig';
import csrfManager from '../utils/csrfManager';

// Create admin API client with CSRF protection
const createAdminAPIClient = () => {
  const client = axios.create({
    baseURL: "https://localhost:3000/api/admin",
    ...getApiClientConfig()
  });

  // Request interceptor to add CSRF tokens for sensitive operations
  client.interceptors.request.use(async (config) => {
    const sensitiveMethods = ['post', 'put', 'delete', 'patch'];

    if (sensitiveMethods.includes(config.method)) {
      try {
        const csrfToken = await csrfManager.getCurrentToken();
        if (csrfToken) {
          config.headers['X-CSRF-Token'] = csrfToken;
          console.log('🔒 Added CSRF token to admin request:', config.method?.toUpperCase(), config.url);
        } else {
          console.warn('⚠️ No CSRF token available for admin operation:', config.method?.toUpperCase(), config.url);
        }
      } catch (error) {
        console.error('❌ Error getting CSRF token for admin request:', error);
      }
    }

    return config;
  });

  // Response interceptor to handle CSRF errors
  client.interceptors.response.use(
    (response) => response,
    async (error) => {
      console.error('❌ Admin API Error:', {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response?.status,
        statusText: error.response?.statusText,
        message: error.message
      });

      if (error.response?.status === 403) {
        const errorCode = error.response.data?.code;

        if (errorCode === 'CSRF_TOKEN_MISSING' ||
          errorCode === 'CSRF_TOKEN_INVALID' ||
          errorCode === 'CSRF_TOKEN_MISMATCH') {

          console.warn('🔄 CSRF token error detected in admin request, attempting refresh...');

          // Try to refresh the token
          await csrfManager.refreshToken();

          // Retry the original request
          const originalRequest = error.config;
          const csrfToken = await csrfManager.getCurrentToken();

          if (csrfToken) {
            originalRequest.headers['X-CSRF-Token'] = csrfToken;
            console.log('🔄 Retrying admin request with refreshed CSRF token');
            return client(originalRequest);
          }
        }
      }

      return Promise.reject(error);
    }
  );

  return client;
};

const adminApiClient = createAdminAPIClient();

// Add request interceptor for admin API
adminApiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";

    // Define public endpoints that should NOT have auth headers
    const publicEndpoints = [
      '/login', // Admin login endpoint
      '/register', // Admin registration endpoint
    ];

    // Check if this is a public endpoint
    const isPublicEndpoint = publicEndpoints.some(endpoint =>
      config.url?.includes(endpoint)
    );

    // Add authorization header for protected endpoints
    if (!isPublicEndpoint && token && isLoggedIn) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    console.log("🟡 Admin API Request:", {
      url: config.url,
      method: config.method,
      hasAuthHeader: !!config.headers.Authorization,
      authHeaderValue: config.headers.Authorization ? 'Bearer ***' : 'none'
    });

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle authentication errors
adminApiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn('🔒 401 Unauthorized - Admin token may be expired');
      // Dispatch event for AuthContext to handle
      const event = new CustomEvent('adminAuthError', { detail: { error: error.response?.data } });
      window.dispatchEvent(event);
    } else if (error.response?.status === 403) {
      console.warn('🚫 403 Forbidden - Admin access denied');
      // Dispatch event for AuthContext to handle
      const event = new CustomEvent('adminAuthError', { detail: { error: error.response?.data } });
      window.dispatchEvent(event);
    }

    return Promise.reject(error);
  }
);

// ============================================================================
// AUTHENTICATION ENDPOINTS
// ============================================================================

export const adminLogin = async (email, password) => {
  return await adminApiClient.post('/login', {
    email,
    password
  });
};

export const adminRegister = async (adminData) => {
  return await adminApiClient.post('/register', adminData);
};

export const adminLogout = async (token) => {
  return await adminApiClient.post('/logout', {}, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
};

export const adminLogoutAllDevices = async (token) => {
  return await adminApiClient.post('/logout-all', {}, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
};

export const adminChangePassword = async (token, passwordData) => {
  return await adminApiClient.post('/change-password', passwordData, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
};

// ============================================================================
// DASHBOARD ENDPOINTS
// ============================================================================

/**
 * Get dashboard statistics
 * GET /api/admin/dashboard/stats
 */
export const getDashboardStats = async () => {
  try {
    const response = await adminApiClient.get('/dashboard/stats');
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching dashboard stats:', error);
    throw error;
  }
};

// ============================================================================
// USER MANAGEMENT ENDPOINTS
// ============================================================================

/**
 * Get all users with pagination and filtering
 * GET /api/admin/users?page=1&limit=10&search=john&status=active&sortBy=createdAt&sortOrder=desc
 */
export const getAllUsers = async (params = {}) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      status = 'all',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = params;

    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      search,
      status,
      sortBy,
      sortOrder
    });

    const response = await adminApiClient.get(`/users?${queryParams}`);
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching users:', error);
    throw error;
  }
};

/**
 * Get user details by ID
 * GET /api/admin/users/:userId
 */
export const getUserDetails = async (userId) => {
  try {
    const response = await adminApiClient.get(`/users/${userId}`);
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching user details:', error);
    throw error;
  }
};

/**
 * Block a user
 * POST /api/admin/users/:userId/block
 */
export const blockUser = async (userId, reason) => {
  try {
    const response = await adminApiClient.post(`/users/${userId}/block`, {
      reason
    });
    return response.data;
  } catch (error) {
    console.error('❌ Error blocking user:', error);
    throw error;
  }
};

/**
 * Unblock a user
 * POST /api/admin/users/:userId/unblock
 */
export const unblockUser = async (userId) => {
  try {
    const response = await adminApiClient.post(`/users/${userId}/unblock`);
    return response.data;
  } catch (error) {
    console.error('❌ Error unblocking user:', error);
    throw error;
  }
};

/**
 * Get user logs with pagination and filtering
 * GET /api/admin/users/:userId/logs?page=1&limit=20&action=login&severity=high&startDate=2024-01-01&endDate=2024-12-31
 */
export const getUserLogs = async (userId, params = {}) => {
  try {
    const {
      page = 1,
      limit = 20,
      action = '',
      severity = '',
      startDate = '',
      endDate = ''
    } = params;

    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString()
    });

    if (action) queryParams.append('action', action);
    if (severity) queryParams.append('severity', severity);
    if (startDate) queryParams.append('startDate', startDate);
    if (endDate) queryParams.append('endDate', endDate);

    const response = await adminApiClient.get(`/users/${userId}/logs?${queryParams}`);
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching user logs:', error);
    throw error;
  }
};

// ============================================================================
// PRODUCT MANAGEMENT ENDPOINTS (if needed)
// ============================================================================

/**
 * Get all products with pagination and filtering
 * GET /api/admin/products?page=1&limit=10&status=approved&search=shirt
 */
export const getAllProducts = async (params = {}) => {
  try {
    const {
      page = 1,
      limit = 10,
      status = '',
      search = ''
    } = params;

    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString()
    });

    if (status) queryParams.append('status', status);
    if (search) queryParams.append('search', search);

    const response = await adminApiClient.get(`/products?${queryParams}`);
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching products:', error);
    throw error;
  }
};

/**
 * Update product status
 * PUT /api/admin/products/:productId/status
 */
export const updateProductStatus = async (productId, status, reason = '') => {
  try {
    const response = await adminApiClient.put(`/products/${productId}/status`, {
      status,
      reason
    });
    return response.data;
  } catch (error) {
    console.error('❌ Error updating product status:', error);
    throw error;
  }
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Check if user is admin
 */
export const isAdmin = () => {
  const role = localStorage.getItem("role");
  return role === "admin";
};

/**
 * Get admin token
 */
export const getAdminToken = () => {
  return localStorage.getItem("token");
};

/**
 * Clear admin auth data and redirect to login
 */
export const clearAdminAuthAndRedirect = () => {
  console.log('🔑 Clearing admin auth data and redirecting to login');

  // Clear all auth data
  localStorage.removeItem("isLoggedIn");
  localStorage.removeItem("userId");
  localStorage.removeItem("role");
  localStorage.removeItem("token");
  localStorage.removeItem("lastLoginTime");
  localStorage.removeItem("justLoggedIn");

  // Redirect to admin login page
  window.location.href = "/admin/login";
};

// Export the client for direct use if needed
export { adminApiClient };
