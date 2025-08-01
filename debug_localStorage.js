// Debug localStorage and session state
console.log('🔍 Debug localStorage and Session State:');
console.log('=====================================');

// Basic localStorage items
console.log('📦 localStorage items:');
console.log('token:', localStorage.getItem('token') ? `${localStorage.getItem('token').substring(0, 20)}...` : 'null');
console.log('userId:', localStorage.getItem('userId'));
console.log('role:', localStorage.getItem('role'));
console.log('isLoggedIn:', localStorage.getItem('isLoggedIn'));
console.log('email:', localStorage.getItem('email'));
console.log('fname:', localStorage.getItem('fname'));
console.log('justLoggedIn:', localStorage.getItem('justLoggedIn'));

// Secure session
console.log('\n🔐 Secure Session:');
const secureSession = localStorage.getItem('secureSession');
if (secureSession) {
    try {
        const parsed = JSON.parse(secureSession);
        console.log('Session data:', {
            userId: parsed.userId,
            role: parsed.role,
            email: parsed.email,
            createdAt: parsed.createdAt,
            expiresAt: parsed.expiresAt,
            lastActivity: parsed.lastActivity,
            isExpired: new Date(parsed.expiresAt) < new Date()
        });
    } catch (e) {
        console.log('Error parsing secure session:', e);
    }
} else {
    console.log('No secure session found');
}

// Session timeout calculations
console.log('\n⏰ Session Timeout Info:');
const now = new Date();
console.log('Current time:', now.toISOString());
if (secureSession) {
    try {
        const parsed = JSON.parse(secureSession);
        const expiresAt = new Date(parsed.expiresAt);
        const timeUntilExpiry = expiresAt.getTime() - now.getTime();
        const minutesUntilExpiry = Math.floor(timeUntilExpiry / (1000 * 60));
        console.log('Session expires at:', expiresAt.toISOString());
        console.log('Minutes until expiry:', minutesUntilExpiry);
        console.log('Session is expired:', timeUntilExpiry < 0);
    } catch (e) {
        console.log('Error calculating session timeout:', e);
    }
}

// AuthContext state (if available)
console.log('\n🔑 AuthContext State (if available):');
if (window.authContextDebug) {
    console.log('AuthContext debug info:', window.authContextDebug);
}

// Security config
console.log('\n🛡️ Security Configuration:');
console.log('Session timeout (minutes):', 120); // From security.js
console.log('Security init timeout (ms):', 120 * 60 * 1000); // From securityInit.js

console.log('\n=====================================');
