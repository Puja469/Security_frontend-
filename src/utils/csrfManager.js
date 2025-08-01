// CSRF token management utility
class CSRFManager {
    constructor() {
        this.token = null;
        this.tokenExpiry = null;
        this.isRefreshing = false;
    }

    // Get CSRF token from server
    async getToken() {
        try {
            console.log('🔒 Fetching CSRF token...');
            const response = await fetch('/api/csrf/token', {
                method: 'GET',
                credentials: 'include', // Important for cookies
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.token = data.data.token;
                this.tokenExpiry = Date.now() + data.data.expiresIn;

                // Also get token from response header
                const headerToken = response.headers.get('X-CSRF-Token');
                if (headerToken) {
                    this.token = headerToken;
                }

                console.log('✅ CSRF token obtained:', this.token ? 'Token received' : 'No token');
                return this.token;
            } else {
                console.warn('⚠️ Failed to get CSRF token:', response.status);
            }
        } catch (error) {
            console.error('❌ Error fetching CSRF token:', error);
        }
        return null;
    }

    // Refresh CSRF token
    async refreshToken() {
        if (this.isRefreshing) {
            console.log('🔄 CSRF token refresh already in progress...');
            return this.token;
        }

        this.isRefreshing = true;
        try {
            console.log('🔄 Refreshing CSRF token...');
            const response = await fetch('/api/csrf/refresh', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': this.token
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.token = data.data.token;
                this.tokenExpiry = Date.now() + data.data.expiresIn;
                console.log('✅ CSRF token refreshed');
                return this.token;
            } else {
                console.warn('⚠️ Failed to refresh CSRF token:', response.status);
            }
        } catch (error) {
            console.error('❌ Error refreshing CSRF token:', error);
        } finally {
            this.isRefreshing = false;
        }
        return null;
    }

    // Get current token (refresh if expired)
    async getCurrentToken() {
        if (!this.token || (this.tokenExpiry && Date.now() > this.tokenExpiry)) {
            console.log('🔄 CSRF token expired or missing, fetching new token...');
            await this.getToken();
        }
        return this.token;
    }

    // Check if token is valid
    async validateToken(token) {
        try {
            const response = await fetch('/api/csrf/validate', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': token
                },
                body: JSON.stringify({ token })
            });

            return response.ok;
        } catch (error) {
            console.error('❌ Error validating CSRF token:', error);
            return false;
        }
    }

    // Clear token (for logout)
    clearToken() {
        this.token = null;
        this.tokenExpiry = null;
        console.log('🧹 CSRF token cleared');
    }

    // Get token status for debugging
    getTokenStatus() {
        return {
            hasToken: !!this.token,
            isExpired: this.tokenExpiry ? Date.now() > this.tokenExpiry : true,
            expiresIn: this.tokenExpiry ? this.tokenExpiry - Date.now() : null,
            isRefreshing: this.isRefreshing
        };
    }
}

// Global CSRF manager instance
const csrfManager = new CSRFManager();

export default csrfManager; 