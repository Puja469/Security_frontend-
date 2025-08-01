import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import csrfManager from '../utils/csrfManager';

export const useCSRF = () => {
    const [csrfToken, setCsrfToken] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { isAuthenticated } = useAuth();

    useEffect(() => {
        const initializeCSRF = async () => {
            try {
                setLoading(true);
                setError(null);

                // Only get CSRF token if user is authenticated
                if (isAuthenticated()) {
                    console.log('🔒 Initializing CSRF protection for authenticated user...');
                    const token = await csrfManager.getToken();
                    setCsrfToken(token);
                } else {
                    console.log('👤 User not authenticated, skipping CSRF initialization');
                    setCsrfToken(null);
                }
            } catch (err) {
                console.error('❌ CSRF initialization error:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        initializeCSRF();
    }, [isAuthenticated]);

    const refreshToken = async () => {
        try {
            setError(null);
            const token = await csrfManager.refreshToken();
            setCsrfToken(token);
            return token;
        } catch (err) {
            console.error('❌ CSRF token refresh error:', err);
            setError(err.message);
            throw err;
        }
    };

    const clearToken = () => {
        csrfManager.clearToken();
        setCsrfToken(null);
        setError(null);
    };

    const getTokenStatus = () => {
        return csrfManager.getTokenStatus();
    };

    return {
        csrfToken,
        loading,
        error,
        refreshToken,
        clearToken,
        getTokenStatus
    };
}; 