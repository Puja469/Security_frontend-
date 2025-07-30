import React from 'react';
import { useCSRF } from '../hooks/useCSRF';

const CSRFProtection = ({ children, showStatus = false }) => {
    const { csrfToken, loading, error, getTokenStatus } = useCSRF();

    // Don't block the app from loading, just show a warning if there's an error
    if (loading) {
        return (
            <>
                {children}
                {showStatus && (
                    <div className="fixed top-4 right-4 bg-blue-50 border border-blue-200 rounded-md p-2 text-xs opacity-75">
                        <div>🔒 Initializing CSRF protection...</div>
                    </div>
                )}
            </>
        );
    }

    // Show error as a non-blocking warning
    if (error && showStatus) {
        console.warn('⚠️ CSRF protection error:', error);
    }

    return (
        <>
            {children}
            {showStatus && (
                <div className="fixed bottom-4 right-4 bg-gray-800 text-white p-2 rounded-md text-xs opacity-50 hover:opacity-100 transition-opacity">
                    <div>CSRF: {csrfToken ? '🟢 Active' : '🔴 Inactive'}</div>
                    <div>Status: {getTokenStatus().isExpired ? 'Expired' : 'Valid'}</div>
                    {error && <div className="text-red-300">Error: {error}</div>}
                </div>
            )}
        </>
    );
};

export default CSRFProtection; 