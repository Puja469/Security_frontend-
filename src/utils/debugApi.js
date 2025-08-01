// Debug utility to test API connectivity
export const debugApiConnectivity = async () => {
    console.log('🔍 Testing API connectivity...');

    const tests = [
        {
            name: 'Public API - Categories',
            url: '/api/category',
            method: 'GET'
        },
        {
            name: 'Public API - Items',
            url: '/api/item?status=Approved',
            method: 'GET'
        },
        {
            name: 'CSRF Token',
            url: '/api/csrf/token',
            method: 'GET'
        }
    ];

    for (const test of tests) {
        try {
            console.log(`🧪 Testing: ${test.name}`);
            const response = await fetch(test.url, {
                method: test.method,
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            console.log(`✅ ${test.name}:`, {
                status: response.status,
                statusText: response.statusText,
                ok: response.ok
            });

            if (response.ok) {
                const data = await response.json();
                console.log(`📦 ${test.name} data:`, data);
            }
        } catch (error) {
            console.error(`❌ ${test.name} failed:`, error);
        }
    }
};

// Test authentication state
export const debugAuthState = () => {
    console.log('🔍 Debugging authentication state...');

    const authInfo = {
        localStorage: {
            isLoggedIn: localStorage.getItem('isLoggedIn'),
            userId: localStorage.getItem('userId'),
            role: localStorage.getItem('role')
        },
        cookies: {
            hasToken: document.cookie.includes('token='),
            cookieString: document.cookie
        },
        currentUrl: window.location.href,
        userAgent: navigator.userAgent
    };

    console.log('🔍 Auth state:', authInfo);
    return authInfo;
};

// Test CSRF functionality
export const debugCSRF = async () => {
    console.log('🔍 Testing CSRF functionality...');

    try {
        // Test CSRF token fetch
        const response = await fetch('/api/csrf/token', {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        console.log('🔒 CSRF token response:', {
            status: response.status,
            ok: response.ok,
            headers: Object.fromEntries(response.headers.entries())
        });

        if (response.ok) {
            const data = await response.json();
            console.log('🔒 CSRF token data:', data);
        }
    } catch (error) {
        console.error('❌ CSRF test failed:', error);
    }
};

// Run all debug tests
export const runAllDebugTests = async () => {
    console.log('🚀 Running all debug tests...');

    debugAuthState();
    await debugApiConnectivity();
    await debugCSRF();

    console.log('✅ All debug tests completed');
}; 