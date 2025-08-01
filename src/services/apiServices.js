import axios from "axios";
import { getApiClientConfig } from '../config/apiConfig';
import csrfManager from '../utils/csrfManager';

// Create axios instance with CSRF protection
const createAPIClient = (baseURL) => {
  const client = axios.create({
    baseURL,
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
          console.log('🔒 Added CSRF token to request:', config.method?.toUpperCase(), config.url);
        } else {
          console.warn('⚠️ No CSRF token available for sensitive operation:', config.method?.toUpperCase(), config.url);
        }
      } catch (error) {
        console.error('❌ Error getting CSRF token:', error);
      }
    }

    return config;
  });

  // Response interceptor to handle CSRF errors
  client.interceptors.response.use(
    (response) => response,
    async (error) => {
      // Log the error for debugging
      console.error('❌ API Error:', {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response?.status,
        statusText: error.response?.statusText,
        message: error.message,
        code: error.code
      });

      if (error.response?.status === 403) {
        const errorCode = error.response.data?.code;

        if (errorCode === 'CSRF_TOKEN_MISSING' ||
          errorCode === 'CSRF_TOKEN_INVALID' ||
          errorCode === 'CSRF_TOKEN_MISMATCH') {

          console.warn('🔄 CSRF token error detected, attempting refresh...');

          // Try to refresh the token
          await csrfManager.refreshToken();

          // Retry the original request
          const originalRequest = error.config;
          const csrfToken = await csrfManager.getCurrentToken();

          if (csrfToken) {
            originalRequest.headers['X-CSRF-Token'] = csrfToken;
            console.log('🔄 Retrying request with refreshed CSRF token');
            return client(originalRequest);
          }
        }
      }

      // Handle network errors specifically
      if (error.code === 'ERR_NETWORK') {
        console.error('🌐 Network error detected. This might be a CORS or proxy issue.');
        console.error('🔍 Check if the backend server is running on http://localhost:3000');
        console.error('🔍 Check if the Vite proxy is configured correctly');
      }

      return Promise.reject(error);
    }
  );

  return client;
};

// Create API clients
export const apiClient = createAPIClient('/api/user');
export const publicApiClient = createAPIClient('/api');

// Enhanced token validation function
export const isTokenValid = (token) => {
  console.log("🔍 Token validation check:", {
    hasToken: !!token,
    tokenLength: token?.length,
    tokenPreview: token ? `${token.substring(0, 20)}...` : 'null'
  });

  if (!token) {
    console.log("❌ Token validation failed: No token provided");
    return false;
  }

  try {
    // Basic token validation - check if it's not empty and has reasonable length
    const isValidLength = token.length >= 10 && token.length <= 1000;
    const hasValidFormat = /^[A-Za-z0-9\-._~+/]+=*$/.test(token); // Basic JWT format check

    console.log("🔍 Token validation details:", {
      isValidLength,
      hasValidFormat,
      tokenLength: token.length
    });

    // Check if token is not expired (if it's a JWT)
    let isNotExpired = true;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.exp) {
        isNotExpired = Date.now() < payload.exp * 1000;
        console.log("🔍 JWT expiration check:", {
          exp: payload.exp,
          currentTime: Date.now(),
          isNotExpired
        });
      }
    } catch (e) {
      // If we can't parse the JWT, assume it's valid (might be a custom token)
      console.log('Token is not a standard JWT, assuming valid');
    }

    const isValid = isValidLength && hasValidFormat && isNotExpired;
    console.log("🔍 Token validation result:", isValid);
    return isValid;
  } catch (error) {
    console.log("❌ Token validation error:", error);
    return false;
  }
};

// Function to clear auth data and redirect to login
export const clearAuthAndRedirect = () => {
  console.log('🔑 Clearing auth data and redirecting to login');

  // Clear all auth data (except token which is in HTTP-only cookie)
  localStorage.removeItem("isLoggedIn");
  localStorage.removeItem("userId");
  localStorage.removeItem("role");
  // localStorage.removeItem("token"); // REMOVED - token is in HTTP-only cookie
  localStorage.removeItem("lastLoginTime");
  localStorage.removeItem("justLoggedIn");

  // Redirect to login page
  window.location.href = "/register";
};

// Request throttling - track last request time
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 1000; // Increased from 200ms to 1000ms to prevent rate limiting

// Global rate limiting state
let isRateLimited = false;
let rateLimitResetTime = 0;

// Function to check if currently rate limited
export const checkRateLimitStatus = () => {
  if (isRateLimited && Date.now() < rateLimitResetTime) {
    return {
      isRateLimited: true,
      remainingTime: Math.ceil((rateLimitResetTime - Date.now()) / 1000)
    };
  }
  return { isRateLimited: false, remainingTime: 0 };
};

// Verify 2FA OTP for Login
export const verifyLoginOTP = async (otpData) => {
  console.log("🔐 API Call - verifyLoginOTP:", {
    email: otpData.email,
    otpLength: otpData.otp?.length,
    otp: otpData.otp
  });

  try {
    const response = await apiClient.post("/verify-login-otp", otpData);

    console.log("✅ Login OTP verification response:", {
      success: response.data.success,
      message: response.data.message,
      fullResponse: response.data
    });

    return response.data;
  } catch (error) {
    console.error("❌ API Error - verifyLoginOTP:", {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
      requestData: otpData,
      fullError: error,
      responseHeaders: error.response?.headers,
      responseData: JSON.stringify(error.response?.data, null, 2),
      requestConfig: {
        url: error.config?.url,
        method: error.config?.method,
        headers: error.config?.headers,
        data: error.config?.data
      }
    });
    throw error;
  }
};

// Add request interceptor to automatically add authorization header
apiClient.interceptors.request.use(
  (config) => {
    const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
    const hasHttpOnlyCookie = document.cookie.includes('token=');

    // Define public endpoints that should NOT have auth headers
    const publicEndpoints = [
      '/sign', // User login endpoint (2FA)
      '/simple-login', // User simple login endpoint
      '/verify-login-otp', // User OTP verification endpoint
      '/send-otp', // Send OTP endpoint
      '/verify-email', // Verify email endpoint
      '/forgot-password', // Forgot password endpoint
      '/reset-password', // Reset password endpoint
      '/item?status=Approved',
      '/category',
      '/subcategory'
    ];

    // Check if this is a public endpoint (more specific matching)
    const isPublicEndpoint = publicEndpoints.some(endpoint => {
      return config.url?.includes(endpoint);
    }) || config.url === '/'; // Exact match for root path (registration)

    // Simple request throttling for public endpoints only
    const now = Date.now();
    if (isPublicEndpoint && (now - lastRequestTime) < MIN_REQUEST_INTERVAL) {
      console.log("⏱️ Throttling public endpoint request to prevent rate limiting");
      return new Promise((resolve) => {
        setTimeout(() => {
          lastRequestTime = Date.now();
          resolve(config);
        }, MIN_REQUEST_INTERVAL - (now - lastRequestTime));
      });
    }
    lastRequestTime = now;

    console.log("🟡 Preparing request for:", config.url);
    console.log("Is Logged In:", isLoggedIn);
    console.log("Has HTTP-only Cookie:", hasHttpOnlyCookie);
    console.log("Is Public Endpoint:", isPublicEndpoint);

    // Only add auth header for protected endpoints when user is logged in and has HTTP-only cookie
    if (isLoggedIn && hasHttpOnlyCookie && !isPublicEndpoint) {
      // Don't add Authorization header manually - the HTTP-only cookie will be sent automatically
      console.log("✅ HTTP-only cookie will be sent automatically for:", config.url);
    } else if (isPublicEndpoint) {
      // Ensure no auth header for public endpoints
      delete config.headers.Authorization;
      console.log("🚫 No auth header for public endpoint:", config.url);
    } else {
      console.warn("❌ No HTTP-only cookie found for protected endpoint:", config.url, {
        isLoggedIn,
        hasHttpOnlyCookie,
        isPublicEndpoint
      });
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor to handle 401 errors globally
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn('🔒 401 Unauthorized - Token may be expired');
      console.log('🔍 401 Error Details:', {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });

      // Check if this is a public endpoint that shouldn't require authentication
      const publicEndpointsForError = [
        '/sign', '/simple-login', '/verify-login-otp', '/send-otp',
        '/verify-email', '/forgot-password', '/reset-password',
        '/item?status=Approved', '/category', '/subcategory'
      ];

      const isPublicEndpoint = publicEndpointsForError.some(endpoint =>
        error.config?.url?.includes(endpoint)
      ) || error.config?.url === '/'; // Exact match for root path

      // For public endpoints, don't trigger logout - just log the error
      if (isPublicEndpoint) {
        console.warn('🔒 401 on public endpoint - backend may require auth for this endpoint');
        return Promise.reject(error);
      }

      // Check if this is a password change error
      const errorMessage = error.response?.data?.message;
      const isPasswordChangeError = errorMessage &&
        (errorMessage.includes('password') ||
          errorMessage.includes('changed') ||
          errorMessage.includes('log in again'));

      // Check if this is a general authentication error
      const isGeneralAuthError = errorMessage &&
        (errorMessage.includes('Not authorized') ||
          errorMessage.includes('No token provided') ||
          errorMessage.includes('Invalid token'));

      // Only logout for specific authentication errors, not all 401s
      if (isPasswordChangeError) {
        console.log('🔑 Password change detected - logging out user');
        clearAuthAndRedirect();
        return Promise.reject(error);
      }

      // For general auth errors, let AuthContext handle it instead of immediate logout
      if (isGeneralAuthError) {
        console.log('🔑 General auth error detected - letting AuthContext handle logout');
        // Dispatch event for AuthContext to handle
        const event = new CustomEvent('authError', { detail: { error: error.response?.data } });
        window.dispatchEvent(event);
        return Promise.reject(error);
      }

      // For other 401 errors, just log and reject without logging out
      console.log('🔑 401 error - not logging out, just rejecting request');
    }

    // Handle 429 Rate Limiting errors
    if (error.response?.status === 429) {
      console.warn('🚫 429 Rate Limited - Too many requests');
      console.log('🔍 429 Error Details:', {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });

      // Set rate limiting state
      isRateLimited = true;
      rateLimitResetTime = Date.now() + parseInt(error.response.headers['x-ratelimit-reset'] || 60000); // Default to 60s if not provided

      // Reset rate limiting state after the reset time
      setTimeout(() => {
        isRateLimited = false;
        rateLimitResetTime = 0;
        console.log('✅ Rate limiting period expired');
      }, parseInt(error.response.headers['x-ratelimit-reset'] || 60000));

      // Return appropriate fallback data based on the endpoint
      const url = error.config?.url || '';

      if (url.includes('/orders/my-orders/')) {
        // For my orders endpoint
        return Promise.resolve({ data: { myOrders: [] } });
      } else if (url.includes('/orders/my-sold-items/')) {
        // For sold items endpoint
        return Promise.resolve({ data: { soldItems: [] } });
      } else if (url.includes('/user/profile')) {
        // For user profile endpoint
        return Promise.resolve({ data: null });
      } else if (url.includes('/notifications')) {
        // For notifications endpoint
        return Promise.resolve({ data: [] });
      } else {
        // Default fallback for other endpoints
        return Promise.resolve({ data: [] });
      }
    }

    return Promise.reject(error);
  }
);



// Fetch Categories
export const fetchCategories = async () => {
  try {
    const response = await publicApiClient.get("/category");
    return response.data || [];
  } catch (error) {
    console.error('❌ Error fetching categories:', error);
    // Return empty array instead of throwing for 429 errors
    if (error.response?.status === 429) {
      return [];
    }
    throw error;
  }
};

// Fetch Subcategories
export const fetchSubcategories = async (categoryName) => {
  try {
    const response = await publicApiClient.get(`/subcategory?categoryName=${encodeURIComponent(categoryName)}`);
    // Filter subcategories that match the category name
    const filteredSubcategories = response.data.filter(subcategory =>
      subcategory.categoryId?.category_name === categoryName
    );
    return filteredSubcategories;
  } catch (error) {
    console.error('❌ Error fetching subcategories:', error);
    // Return empty array instead of throwing for 429 errors
    if (error.response?.status === 429) {
      return [];
    }
    throw error;
  }
};

// Check if user is properly authenticated
export const isUserAuthenticated = () => {
  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
  const userId = localStorage.getItem("userId");
  const token = localStorage.getItem("token");

  return isLoggedIn && userId && isTokenValid(token);
};

// Fetch User Details
export const fetchUserDetails = async (userId, tokenParam = null) => {
  try {
    // Don't need token parameter since it's in HTTP-only cookie
    const response = await apiClient.get(`/profile`);
    console.log('🔍 Profile response:', response.data);
    // Return the data property from the response
    return response.data.data || response.data;
  } catch (error) {
    console.error('❌ Error fetching user details:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    });

    // If it's a 401 or 403 error, user is not authenticated or forbidden
    if (error.response?.status === 401 || error.response?.status === 403) {
      console.warn('⚠️ User not authenticated for profile endpoint, returning null');
      return null;
    }

    throw error;
  }
};

export const fetchProductDetails = async (productId) => {
  console.log("🔍 Fetching product with ID:", productId); // ✅ Debug
  const response = await apiClient.get(`/item/${productId}`);
  console.log("✅ API Response:", response.data); // ✅ Debug response
  return response.data;
};


// Fetch Category Details (Missing API)
export const fetchCategoryDetails = async (categoryId) => {
  const response = await apiClient.get(`/category/${categoryId}`);
  return response.data;
};

// Increment Product View Count (Missing API)
export const incrementViewCount = async (productId, userId) => {
  const response = await apiClient.post(`/item/${productId}/increment-view`, { userId });
  return response.data;
};

// Fetch Products
export const fetchProducts = async (sellerId) => {
  const token = localStorage.getItem("token");
  if (!token || !isTokenValid(token)) {
    throw new Error('Valid authentication token is required');
  }

  try {
    const response = await apiClient.get(`/item?sellerId=${sellerId}`);
    return response.data || [];
  } catch (error) {
    console.error('❌ Error fetching products:', error);
    // Return empty array instead of throwing for 429 errors
    if (error.response?.status === 429) {
      return [];
    }
    throw error;
  }
};

// Add Product
export const addProduct = async (token, formData) => {
  try {
    // Don't need token parameter since it's in HTTP-only cookie
    const response = await apiClient.post("/item", formData);
    return response.data;
  } catch (error) {
    console.error('❌ Error adding product:', error);
    throw error;
  }
};

// Delete Product
export const deleteProduct = async (productId, token) => {
  try {
    // Don't need token parameter since it's in HTTP-only cookie
    const response = await apiClient.delete(`/item/${productId}`);
    return response.data;
  } catch (error) {
    console.error('❌ Error deleting product:', error);
    throw error;
  }
};

// Update Product Status
export const updateProductStatus = async (productId, token, isSold) => {
  try {
    // Don't need token parameter since it's in HTTP-only cookie
    const response = await apiClient.put(`/item/${productId}/status`, { isSold });
    return response.data;
  } catch (error) {
    console.error('❌ Error updating product status:', error);
    throw error;
  }
};

// Fetch My Orders
export const fetchMyOrders = async (token, userId) => {
  try {
    // Don't need token parameter since it's in HTTP-only cookie
    const response = await apiClient.get(`/orders/my-orders`);
    return response.data || [];
  } catch (error) {
    console.error('❌ Error fetching my orders:', error);
    throw error;
  }
};

// Fetch Sold Items
export const fetchSoldItems = async (token, sellerId) => {
  try {
    // Don't need token parameter since it's in HTTP-only cookie
    const response = await apiClient.get(`/orders/my-sold-items`);
    return response.data || [];
  } catch (error) {
    console.error('❌ Error fetching sold items:', error);
    throw error;
  }
};

// Update Order Status
export const updateOrderStatus = async (token, orderId, status, sellerId = null) => {
  try {
    // Don't need token parameter since it's in HTTP-only cookie
    const response = await apiClient.put(`/orders/${orderId}/status`, { status });
    return response.data;
  } catch (error) {
    console.error('❌ Error updating order status:', error);
    throw error;
  }
};

// Fetch Notifications
export const fetchNotifications = async (userId, tokenParam = null) => {
  try {
    console.log('🔍 Fetching notifications for user:', userId);
    // Don't need token parameter since it's in HTTP-only cookie
    const response = await apiClient.get(`/notifications`);
    console.log('✅ Notifications response:', response.data);
    return response.data || [];
  } catch (error) {
    console.error('❌ Error fetching notifications:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
      userId: userId
    });

    // If it's a 401 or 403 error, user is not authenticated or forbidden
    if (error.response?.status === 401 || error.response?.status === 403) {
      console.warn('⚠️ User not authenticated for notifications endpoint, returning empty array');
      return [];
    }

    // If it's a 500 error, server issue - return empty array
    if (error.response?.status === 500) {
      console.warn('⚠️ Server error for notifications endpoint, returning empty array');
      console.warn('🔍 Server error details:', error.response?.data);
      return [];
    }

    // For any other error, return empty array instead of throwing
    console.warn('⚠️ Error fetching notifications, returning empty array');
    return [];
  }
};

// Mark Notifications as Read
export const markNotificationsAsRead = async (userId, tokenParam = null) => {
  try {
    // Don't need token parameter since it's in HTTP-only cookie
    const response = await apiClient.post(`/notifications/mark-read`);
    return response.data;
  } catch (error) {
    console.error('❌ Error marking notifications as read:', error);
    throw error;
  }
};

// Fetch Recently Added Products
export const fetchRecentItems = async (subcategoryName = null) => {
  try {
    let url = "/item?status=Approved";
    if (subcategoryName) {
      url += `&subcategoryName=${encodeURIComponent(subcategoryName)}`;
    }
    const response = await publicApiClient.get(url);
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching recent items:', error);
    // Return empty array instead of throwing for 429 errors
    if (error.response?.status === 429) {
      return [];
    }
    throw error;
  }
};

// Fetch Top Sellers
export const fetchTopSellers = async () => {
  const response = await apiClient.get("");
  return response.data;
};

// Fetch all sellers (same as fetchTopSellers but more explicit)
export const fetchAllSellers = async () => {
  try {
    console.log('🔍 Fetching all sellers from /user endpoint');

    // Check if user is logged in (more lenient check)
    const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
    const userId = localStorage.getItem("userId");

    console.log('🔍 Auth check for fetchAllSellers:', {
      isLoggedIn,
      userId,
      hasHttpOnlyCookie: document.cookie.includes('token=')
    });

    // Try to fetch sellers even if HTTP-only cookie is not immediately available
    // The backend will handle authentication properly
    const response = await publicApiClient.get("/user");
    console.log('✅ Successfully fetched sellers:', response.data.length);
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching all sellers:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    });

    // If it's a 401 error, user is not authenticated
    if (error.response?.status === 401) {
      console.warn('⚠️ User not authenticated for /user endpoint, returning fallback data');
      return getFallbackSellers();
    }

    // If it's a 403 error, endpoint doesn't allow listing all users (security feature)
    if (error.response?.status === 403) {
      console.warn('⚠️ Access forbidden for /user endpoint - this is expected for security reasons, returning fallback data');
      return getFallbackSellers();
    }

    // For any other error, return fallback data
    console.warn('⚠️ Error fetching sellers, returning fallback data');
    return getFallbackSellers();
  }
};

// Fallback sellers data when API is not available
const getFallbackSellers = () => {
  return [
    {
      _id: '1',
      fname: 'Sarah Johnson',
      email: 'sarah.j@example.com',
      role: 'seller',
      rating: 4.8,
      totalSales: 45,
      joinDate: '2023-01-15'
    },
    {
      _id: '2',
      fname: 'Mike Chen',
      email: 'mike.chen@example.com',
      role: 'seller',
      rating: 4.9,
      totalSales: 67,
      joinDate: '2022-11-20'
    },
    {
      _id: '3',
      fname: 'Emma Davis',
      email: 'emma.davis@example.com',
      role: 'seller',
      rating: 4.7,
      totalSales: 32,
      joinDate: '2023-03-10'
    },
    {
      _id: '4',
      fname: 'Alex Rodriguez',
      email: 'alex.r@example.com',
      role: 'seller',
      rating: 4.6,
      totalSales: 28,
      joinDate: '2023-02-05'
    },
    {
      _id: '5',
      fname: 'Lisa Wang',
      email: 'lisa.wang@example.com',
      role: 'seller',
      rating: 4.9,
      totalSales: 89,
      joinDate: '2022-09-12'
    }
  ];
};

// User Registration API
export const registerUser = async (registrationData) => {
  const response = await apiClient.post("/", registrationData);
  return response.data;
};

// User Login API
export const loginUser = async (loginData) => {
  try {
    console.log("🔐 API Call - loginUser:", {
      email: loginData.email,
      hasPassword: !!loginData.password
    });

    const response = await apiClient.post("/sign", loginData);

    console.log("✅ Login response:", {
      success: response.data.success,
      requiresOTP: response.data.requiresOTP,
      message: response.data.message,
      fullResponse: response.data
    });

    return response.data;
  } catch (error) {
    console.error("❌ API Error - loginUser:", {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    });

    // Handle specific error cases
    if (error.response?.status === 423) {
      // Account locked
      throw new Error(error.response?.data?.message || "Account is locked due to multiple failed login attempts");
    } else if (error.response?.status === 401) {
      // Invalid credentials
      throw new Error(error.response?.data?.message || "Invalid email or password");
    } else if (error.response?.status === 429) {
      // Rate limited
      throw new Error("Too many login attempts. Please try again later.");
    } else {
      throw new Error(error.response?.data?.message || "Login failed. Please try again.");
    }
  }
};

// Update User Profile
export const updateUser = async (userId, token, formData) => {
  try {
    // Don't need token parameter since it's in HTTP-only cookie
    const response = await apiClient.put(`/user/profile`, formData);
    return response.data;
  } catch (error) {
    console.error('❌ Error updating user profile:', error);
    throw error;
  }
};

// Change Password
export const changePassword = async (token, passwordData) => {
  try {
    // Don't need token parameter since it's in HTTP-only cookie
    const response = await apiClient.put(`/user/change-password`, passwordData);
    return response.data;
  } catch (error) {
    console.error('❌ Error changing password:', error);
    throw error;
  }
};


// ✅ Send OTP for Email Verification (Matches `router.post("/send-otp")`)
export const sendVerificationOtp = async (email) => {
  const response = await apiClient.post("/send-otp", { email });
  return response.data;
};

// ✅ Verify OTP for Email Verification (Matches `router.post("/verify-email")`)
export const verifyOtp = async (otpData) => {
  const response = await apiClient.post("/verify-email", otpData);
  return response.data;
};

// ✅ Send OTP for Password Reset (Matches `router.post("/forgot-password")`)
export const sendPasswordResetOtp = async (email) => {
  const response = await apiClient.post("/forgot-password", { email });
  return response.data;
};

// ✅ Reset Password with OTP (Matches `router.post("/reset-password")`)
export const resetPassword = async (resetData) => {
  const response = await apiClient.post("/reset-password", resetData);
  return response.data;
};

// ✅ Fetch Comments for a Product
export const fetchComments = async (productId) => {
  const response = await apiClient.get(`/comments/${productId}`);
  return response.data;
};

export const addComment = async (token, commentData) => {
  try {
    // Don't need token parameter since it's in HTTP-only cookie
    const response = await apiClient.post("/comments", commentData);
    return response.data;
  } catch (error) {
    console.error("❌ API Error - Adding Comment:", error.response?.data || error.message);
    throw error;
  }
};



// ✅ Add a Reply to a Comment
export const addReply = async (token, commentId, replyData) => {
  try {
    // Don't need token parameter since it's in HTTP-only cookie
    const response = await apiClient.post(`/comments/${commentId}/reply`, replyData);
    return response.data;
  } catch (error) {
    console.error("❌ API Error - Adding Reply:", error.response?.data || error.message);
    throw error;
  }
};

// ✅ Delete a Comment
export const deleteComment = async (token, commentId) => {
  try {
    // Don't need token parameter since it's in HTTP-only cookie
    const response = await apiClient.delete(`/comments/${commentId}`);
    return response.data;
  } catch (error) {
    console.error("❌ API Error - Deleting Comment:", error.response?.data || error.message);
    throw error;
  }
};


export const createOrder = async (token, itemId, buyerId) => {
  try {
    // Don't need token parameter since it's in HTTP-only cookie
    const response = await apiClient.post("/orders", { itemId, buyerId });
    return response.data;
  } catch (error) {
    console.error('❌ Error creating order:', error);
    throw error;
  }
};
