import React, { createContext, useContext, useEffect, useState } from 'react';
import csrfManager from '../utils/csrfManager';
import { clearSecureSession, createSecureSession, getSecureSession } from '../utils/security';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [userId, setUserId] = useState(null);
    const [role, setRole] = useState('');
    const [userData, setUserData] = useState(null);
    const [token, setToken] = useState(null); // This will be null since we can't read HTTP-only cookies
    const [loading, setLoading] = useState(true);
    const [isInitialized, setIsInitialized] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false); // Prevent multiple logout calls

    // Initialize auth state from localStorage (excluding token which is in HTTP-only cookie)
    useEffect(() => {
        const initializeAuth = () => {
            try {
                console.log('🔥 Auth context init debug:', {
                    secureSession: !!getSecureSession(),
                    storedUserId: localStorage.getItem('userId'),
                    storedIsLoggedIn: localStorage.getItem('isLoggedIn'),
                    justLoggedIn: localStorage.getItem('justLoggedIn'),
                    currentPath: window.location.pathname,
                    hasHttpOnlyCookie: document.cookie.includes('token=') // Check if HTTP-only cookie exists
                });

                // Check if we just logged in to prevent interference
                const justLoggedIn = localStorage.getItem('justLoggedIn');
                if (justLoggedIn === 'true') {
                    console.log('🔄 Just logged in, setting up authentication state...');

                    // Still set up the authentication state even if just logged in
                    const secureSession = getSecureSession();
                    if (secureSession) {
                        setIsLoggedIn(true);
                        setUserId(secureSession.userId);
                        setRole(secureSession.role);
                        setUserData(secureSession);
                        setToken(null);
                        console.log('✅ Auth initialized from secure session after login');
                    } else {
                        // Fallback to localStorage data
                        const storedUserId = localStorage.getItem('userId');
                        const storedRole = localStorage.getItem('role');
                        const storedIsLoggedIn = localStorage.getItem('isLoggedIn');

                        if (storedUserId && storedIsLoggedIn === 'true') {
                            setIsLoggedIn(true);
                            setUserId(storedUserId);
                            setRole(storedRole || 'user');
                            setToken(null);

                            const basicUserData = {
                                userId: storedUserId,
                                role: storedRole || 'user',
                                email: localStorage.getItem('email') || '',
                                fname: localStorage.getItem('fname') || ''
                            };
                            setUserData(basicUserData);
                            console.log('✅ Auth initialized from localStorage after login');
                        }
                    }

                    // Clear the justLoggedIn flag
                    localStorage.removeItem('justLoggedIn');

                    // Don't set loading to false immediately, wait a bit longer
                    setTimeout(() => {
                        setLoading(false);
                        setIsInitialized(true);
                        console.log('✅ Auth context ready after login');
                    }, 2000); // Wait 2 seconds instead of immediately
                    return;
                }

                const secureSession = getSecureSession();
                if (secureSession) {
                    setIsLoggedIn(true);
                    setUserId(secureSession.userId);
                    setRole(secureSession.role);
                    setUserData(secureSession);
                    // Don't try to read token from localStorage since it's in HTTP-only cookie
                    setToken(null); // Token is in HTTP-only cookie, not accessible via JavaScript
                    console.log('✅ Auth initialized from secure session');
                    return;
                }

                const storedUserId = localStorage.getItem('userId');
                const storedRole = localStorage.getItem('role');
                const storedIsLoggedIn = localStorage.getItem('isLoggedIn');

                // Check if we have user data and the HTTP-only cookie exists
                if (storedUserId && storedIsLoggedIn === 'true' && document.cookie.includes('token=')) {
                    setIsLoggedIn(true);
                    setUserId(storedUserId);
                    setRole(storedRole || 'user');
                    setToken(null); // Token is in HTTP-only cookie

                    const basicUserData = {
                        userId: storedUserId,
                        role: storedRole || 'user',
                        email: localStorage.getItem('email') || '',
                        fname: localStorage.getItem('fname') || ''
                    };
                    setUserData(basicUserData);
                    console.log('✅ Auth initialized from localStorage + HTTP-only cookie');
                } else {
                    console.log('❌ No valid auth data found or missing HTTP-only cookie');
                }
            } catch (error) {
                console.error('Error initializing auth state:', error);
                clearSecureSession();
            } finally {
                setLoading(false);
                setIsInitialized(true);
                console.log('✅ Auth context initialization complete');
            }
        };

        initializeAuth();

        // Listen for session expired events from securityInit
        const handleSessionExpired = () => {
            console.log('🔒 Session expired event received, logging out user');
            logout();
        };

        // Listen for auth errors from API interceptor
        const handleAuthError = (event) => {
            console.log('🔒 Auth error event received:', event.detail);

            // Prevent logout if already in progress
            if (isLoggingOut) {
                console.log('🔒 Logout already in progress, ignoring auth error');
                return;
            }

            // Check if this is a public endpoint error that shouldn't trigger logout
            const errorUrl = event.detail?.error?.config?.url;
            const publicEndpoints = [
                '/sign', '/simple-login', '/verify-login-otp', '/send-otp',
                '/verify-email', '/forgot-password', '/reset-password',
                '/item?status=Approved', '/category', '/subcategory'
            ];

            const isPublicEndpointError = publicEndpoints.some(endpoint =>
                errorUrl?.includes(endpoint)
            ) || errorUrl === '/'; // Exact match for root path

            if (isPublicEndpointError) {
                console.log('🔒 Ignoring auth error for public endpoint:', errorUrl);
                return; // Don't logout for public endpoint errors
            }

            // Add a delay to prevent immediate logout after login
            const isRecentLogin = localStorage.getItem('justLoggedIn') === 'true';
            if (isRecentLogin) {
                console.log('🔒 Ignoring auth error - user just logged in, giving time for state to settle');
                return;
            }

            console.log('🔒 Logging out due to auth error on protected endpoint');
            logout();
        };

        window.addEventListener('sessionExpired', handleSessionExpired);
        window.addEventListener('authError', handleAuthError);

        // Cleanup event listeners
        return () => {
            window.removeEventListener('sessionExpired', handleSessionExpired);
            window.removeEventListener('authError', handleAuthError);
        };
    }, []);

    const login = async (userData, authToken) => {
        try {
            console.log('🔐 Login function called with:', {
                userId: userData.userId,
                role: userData.role,
                hasToken: !!authToken,
                tokenLength: authToken?.length,
                userData: userData
            });

            // Validate required fields
            if (!userData.userId) {
                console.error('❌ Missing required login data:', { userId: userData.userId });
                return false;
            }

            // Prevent logout during login process
            if (isLoggingOut) {
                console.log('🔒 Login blocked - logout in progress');
                return false;
            }

            // Don't store token in localStorage since it's in HTTP-only cookie
            // localStorage.setItem('token', authToken); // REMOVED - token is in HTTP-only cookie

            localStorage.setItem('userId', userData.userId);
            localStorage.setItem('role', userData.role || 'user');
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('email', userData.email || '');
            localStorage.setItem('fname', userData.fname || '');
            localStorage.setItem('justLoggedIn', 'true'); // Add this flag

            createSecureSession(userData);

            setIsLoggedIn(true);
            setUserId(userData.userId);
            setRole(userData.role || 'user');
            setUserData(userData);
            setToken(null); // Token is in HTTP-only cookie, not accessible via JavaScript

            console.log('✅ Login successful:', {
                userId: userData.userId,
                role: userData.role || 'user',
                hasHttpOnlyCookie: document.cookie.includes('token=')
            });
            console.log("🔐 Token is in HTTP-only cookie (not accessible via JavaScript)");
            console.log("✅ HTTP-only cookie present:", document.cookie.includes('token='));

            // Verify the state was set correctly
            setTimeout(() => {
                console.log('🔍 Post-login state verification:', {
                    isLoggedIn: localStorage.getItem('isLoggedIn'),
                    userId: localStorage.getItem('userId'),
                    role: localStorage.getItem('role'),
                    hasHttpOnlyCookie: document.cookie.includes('token=')
                });

                // Also verify the React state
                console.log('🔍 React state verification:', {
                    isLoggedIn: true, // Should be true after login
                    userId: userData.userId,
                    role: userData.role || 'user',
                    hasHttpOnlyCookie: document.cookie.includes('token=')
                });
            }, 100);

            return true;
        } catch (error) {
            console.error('❌ Login error:', error);
            return false;
        }
    };

    const logout = () => {
        console.log('🔒 Logout function called - checking if already in progress...');

        // Prevent multiple logout calls
        if (isLoggingOut) {
            console.log('🔒 Logout already in progress, skipping...');
            return;
        }

        console.log('🔒 Logout stack trace:', new Error().stack);

        try {
            setIsLoggingOut(true);
            console.log('🔒 Starting logout process...');

            // Clear CSRF token
            csrfManager.clearToken();
            console.log('🧹 CSRF token cleared on logout');

            clearSecureSession();
            // Don't remove token from localStorage since it's in HTTP-only cookie
            // localStorage.removeItem('token'); // REMOVED - token is in HTTP-only cookie

            localStorage.removeItem('userId');
            localStorage.removeItem('role');
            localStorage.removeItem('isLoggedIn');
            localStorage.removeItem('email');
            localStorage.removeItem('fname');
            localStorage.removeItem('justLoggedIn');

            setIsLoggedIn(false);
            setUserId(null);
            setRole('');
            setUserData(null);
            setToken(null);

            console.log('✅ Logout successful');

            // Navigate to home page using window.location
            window.location.href = '/';
        } catch (error) {
            console.error('❌ Logout error:', error);
        } finally {
            setIsLoggingOut(false);
        }
    };

    const updateUserData = (newUserData) => {
        try {
            setUserData(prev => ({ ...prev, ...newUserData }));

            if (newUserData.fname) {
                localStorage.setItem('fname', newUserData.fname);
            }
            if (newUserData.email) {
                localStorage.setItem('email', newUserData.email);
            }

            const currentSession = getSecureSession();
            if (currentSession) {
                const updatedSession = { ...currentSession, ...newUserData };
                createSecureSession(updatedSession);
            }
        } catch (error) {
            console.error('❌ Error updating user data:', error);
        }
    };

    // Helper function to check if user is properly authenticated
    const isAuthenticated = () => {
        // Check if we have user data (primary check)
        const hasUserData = isLoggedIn && !!userId;
        const hasHttpOnlyCookie = document.cookie.includes('token=');

        // Be more lenient - if user is logged in and has userId, consider them authenticated
        // The HTTP-only cookie might not be immediately available after login
        const isValid = hasUserData;

        // Only log if there's a significant change in authentication state
        if (process.env.NODE_ENV === 'development' && Math.random() < 0.01) { // Log only 1% of the time
            console.log('🔍 Authentication check:', {
                isLoggedIn,
                userId,
                hasUserData,
                hasHttpOnlyCookie,
                isValid
            });
        }
        return isValid;
    };

    // Debug function to log current auth state
    const debugAuthState = () => {
        console.log('🔍 Current Auth State:', {
            isLoggedIn,
            userId,
            role,
            hasUserData: !!userData,
            hasHttpOnlyCookie: document.cookie.includes('token='),
            localStorage: {
                userId: localStorage.getItem('userId'),
                isLoggedIn: localStorage.getItem('isLoggedIn'),
                role: localStorage.getItem('role')
            }
        });
    };

    const value = {
        isLoggedIn,
        userId,
        role,
        userData,
        token, // This will always be null since we can't read HTTP-only cookies
        loading,
        isInitialized,
        isAuthenticated,
        login,
        logout,
        updateUserData,
        debugAuthState
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
