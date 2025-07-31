# Thrift Store Web Application

A modern, secure, and user-friendly thrift store web application built with React, Vite, and comprehensive security features.

## 🚀 Features

### Core Functionality
- **User Authentication & Authorization** - Secure login/registration with role-based access
- **Product Management** - Add, edit, delete, and browse thrift items
- **Admin Dashboard** - Comprehensive admin panel for store management
- **Real-time Notifications** - Socket.io powered notifications
- **Responsive Design** - Mobile-first approach with Tailwind CSS
- **Dark Mode Support** - Theme switching capability

## 🔒 Comprehensive Security Features

### 1. **Multi-Factor Authentication (MFA)**
- **TOTP Support**: Time-based One-Time Password with authenticator apps
- **SMS Verification**: Phone number-based OTP delivery
- **Email Verification**: Email-based OTP delivery
- **QR Code Generation**: Easy setup for authenticator apps
- **MFA Lockout Protection**: Separate brute force protection for MFA attempts
- **Flexible MFA Types**: Support for multiple verification methods

### 2. **Advanced CAPTCHA Protection**
- **Smart CAPTCHA Triggering**: Only activates when security threats are detected
- **Admin Login CAPTCHA**: Required after 2 failed login attempts
- **User Registration CAPTCHA**: Triggered on registration failures
- **Reusable CAPTCHA Component**: Consistent implementation across the app
- **Visual CAPTCHA**: 6-character alphanumeric codes with refresh capability
- **Accessibility Features**: User-friendly CAPTCHA interface

### 3. **Brute Force Protection System**
- **Maximum Attempts**: 5 failed login attempts before lockout
- **Lockout Duration**: 15-minute account lockout period
- **OTP Protection**: Separate, more lenient protection for OTP verification
- **Automatic Reset**: Lockout clears after successful login
- **Identifier-based Tracking**: Tracks attempts by email/IP
- **Progressive Security**: Increases security measures with failed attempts

### 4. **Rate Limiting & Request Protection**
- **General Rate Limit**: 100 requests per 15 minutes
- **OTP Rate Limit**: 20 requests per 10 minutes (more lenient)
- **IP-based Tracking**: Request tracking by identifier
- **Automatic Reset**: Limits reset after time window
- **Request Throttling**: Prevents API abuse and DDoS attacks
- **Dynamic Rate Limiting**: Adjusts based on user behavior

### 5. **Input Validation & Sanitization**
- **XSS Prevention**: HTML escaping and content filtering
- **Input Sanitization**: Removes malicious HTML, scripts, and event handlers
- **Data Validation**: Comprehensive validation for all user inputs
- **Content Security Policy**: Strict CSP headers implementation
- **DOMPurify Integration**: Advanced HTML sanitization
- **Real-time Validation**: Instant feedback on input quality

### 6. **CSRF Protection**
- **CSRF Token Generation**: Cryptographically secure token generation
- **Token Validation**: Server-side token verification
- **Automatic Token Refresh**: Regular token rotation
- **Sensitive Operation Protection**: All POST/PUT/DELETE operations protected
- **CSRF Hook**: React hook for easy CSRF integration
- **Token Status Monitoring**: Real-time token validity checking

### 7. **Password Security**
- **Strength Requirements**:
  - Minimum 8 characters, maximum 128 characters
  - Must contain uppercase, lowercase, numbers, and special characters
  - No common patterns or sequential characters
  - Real-time strength indicator
- **Client-side Hashing**: SHA-256 hashing before server transmission
- **Password Validation**: Comprehensive validation with detailed feedback
- **Password Strength Indicator**: Visual feedback on password strength
- **Secure Password Storage**: Encrypted password handling

### 8. **Session & Data Security**
- **Encrypted Sessions**: AES encryption for session data
- **Session Timeout**: 30-minute automatic timeout
- **Secure Storage**: Encrypted localStorage usage
- **Activity Tracking**: Last activity monitoring
- **Session Invalidation**: Automatic session cleanup
- **Secure Token Generation**: Cryptographically secure tokens

### 9. **Role-Based Access Control (RBAC)**
- **User Roles**: User, Admin, Moderator with distinct permissions
- **Granular Permissions**: Fine-grained access control
- **Permission Inheritance**: Role-based permission inheritance
- **Dynamic Checking**: Real-time permission validation
- **Protected Routes**: Route-level access control
- **Admin Dashboard**: Secure admin-only functionality

### 10. **Content Moderation & Security**
- **Content Moderation System**: Automated content filtering
- **Profanity Filter**: Inappropriate language detection
- **Spam Detection**: Automated spam identification
- **Content Scoring**: Risk assessment for user-generated content
- **Moderation Dashboard**: Admin tools for content management
- **Real-time Filtering**: Instant content validation

### 11. **Privacy & Data Protection**
- **Privacy Controls**: User-configurable privacy settings
- **Cookie Consent Management**: GDPR-compliant consent handling
- **Data Export**: User data export functionality
- **Data Deletion**: Right to be forgotten implementation
- **Privacy Mode**: Enhanced privacy features
- **Do Not Track**: Respect for user tracking preferences

### 12. **Security Monitoring & Analytics**
- **Activity Logging**: Comprehensive security event tracking
- **Security Dashboard**: Real-time security status monitoring
- **Security Alerts**: Immediate notification of security events
- **Security Audit**: Comprehensive security assessment tools
- **Performance Metrics**: CAPTCHA effectiveness tracking
- **Threat Detection**: Suspicious behavior identification

### 13. **API Security**
- **Secure API Client**: Axios with built-in security features
- **Request Interceptors**: Automatic security header injection
- **Response Validation**: Server response integrity checking
- **Error Handling**: Secure error message handling
- **API Rate Limiting**: Endpoint-specific rate limiting
- **Request Sanitization**: Automatic request data cleaning

### 14. **Client-Side Security**
- **Error Boundaries**: React error boundary implementation
- **Secure Context**: Protected React context providers
- **Component Security**: Security-focused component design
- **State Protection**: Secure state management
- **Memory Protection**: Secure memory handling
- **DOM Security**: Protected DOM manipulation

### 15. **Development & Testing Security**
- **Security Testing**: Comprehensive security test suite
- **Code Quality**: ESLint security rules
- **Dependency Security**: Regular dependency vulnerability scanning
- **Security Documentation**: Comprehensive security documentation
- **Security Guidelines**: Development security best practices
- **Security Review Process**: Code review security requirements

## 🛠️ Technical Stack

### Frontend
- **React 18** - Modern React with hooks and context
- **Vite** - Fast build tool and development server
- **Tailwind CSS** - Utility-first CSS framework
- **React Router** - Client-side routing
- **React Query** - Server state management
- **Socket.io Client** - Real-time communication

### Security Libraries
- **CryptoJS** - Cryptographic functions
- **DOMPurify** - HTML sanitization
- **React Hook Form** - Form validation and handling
- **Axios** - Secure HTTP client
- **React Icons** - UI icons for security components

### Development Tools
- **ESLint** - Code linting and quality
- **Playwright** - End-to-end testing
- **PostCSS** - CSS processing

## 📁 Project Structure

```
thrift_store_web/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── Captcha.jsx     # CAPTCHA component
│   │   ├── MFAVerification.jsx # Multi-factor authentication
│   │   ├── SecurityDashboard.jsx # Security monitoring
│   │   ├── ContentModeration.jsx # Content filtering
│   │   ├── PrivacySettings.jsx # Privacy controls
│   │   ├── SecurityAlert.jsx # Security notifications
│   │   ├── SecurityAudit.jsx # Security assessment
│   │   ├── ProtectedRoute.jsx # Route protection
│   │   └── ...
│   ├── context/            # React context providers
│   │   ├── AuthContext.jsx # Authentication state
│   │   ├── RateLimitContext.jsx # Rate limiting state
│   │   └── ...
│   ├── core/               # Core application logic
│   │   ├── private/        # Protected routes
│   │   │   ├── admin/      # Admin functionality
│   │   │   └── users/      # User functionality
│   │   └── public/         # Public routes
│   ├── services/           # API services
│   │   ├── apiServices.js  # Secure API client
│   │   └── adminApi.js     # Admin API services
│   ├── utils/              # Utility functions
│   │   ├── security.js     # Core security utilities
│   │   ├── apiSecurity.js  # API security middleware
│   │   ├── csrfManager.js  # CSRF token management
│   │   ├── dataProtection.js # Data protection utilities
│   │   └── ...
│   ├── hooks/              # Custom React hooks
│   │   └── useCSRF.js      # CSRF protection hook
│   └── socket/             # Socket.io configuration
├── tests/                  # Test files
└── public/                 # Static assets
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd thrift_store_web
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Run tests**
   ```bash
   npm test
   ```

## 🔧 Configuration

### Security Configuration

The security features can be configured in `src/utils/security.js`:

```javascript
// Password Security
PASSWORD_CONFIG = {
  MIN_LENGTH: 8,
  MAX_LENGTH: 128,
  REQUIRE_UPPERCASE: true,
  REQUIRE_LOWERCASE: true,
  REQUIRE_NUMBERS: true,
  REQUIRE_SPECIAL_CHARS: true,
  BRUTE_FORCE_MAX_ATTEMPTS: 5,
  BRUTE_FORCE_LOCKOUT_MINUTES: 15,
  SESSION_TIMEOUT_MINUTES: 30
}

// Rate Limiting
RATE_LIMIT_REQUESTS: 100,
RATE_LIMIT_WINDOW_MS: 15 * 60 * 1000 // 15 minutes

// MFA Configuration
MFA_CONFIG = {
  MAX_ATTEMPTS: 3,
  LOCKOUT_DURATION: 5 * 60 * 1000, // 5 minutes
  OTP_LENGTH: 6,
  TOTP_PERIOD: 30
}
```

### Environment Variables

```bash
# Security
VITE_ENCRYPTION_KEY=your-secret-key
VITE_API_BASE_URL=https://localhost:3000/api

# Features
VITE_ENABLE_CAPTCHA=true
VITE_ENABLE_MFA=true
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_CONTENT_MODERATION=true
```

## 🧪 Testing

### Security Testing
```bash
# Run security tests
npm run test:security

# Run all tests
npm test

# Run tests with UI
npm run test:ui
```

### Manual Security Testing
1. **Brute Force Protection**: Try multiple failed login attempts
2. **CAPTCHA Functionality**: Trigger CAPTCHA in admin login
3. **MFA Testing**: Test multi-factor authentication flows
4. **Input Validation**: Test with malicious inputs
5. **Session Security**: Test session timeout and encryption
6. **Content Moderation**: Test content filtering features
7. **Privacy Controls**: Test privacy settings functionality

## 📊 Security Monitoring

### Activity Logs
Security events are logged and can be monitored:
- Login attempts (success/failure)
- Registration events
- Admin actions
- Suspicious activity
- MFA verification attempts
- Content moderation events
- Privacy setting changes

### Performance Metrics
- CAPTCHA success rates
- MFA adoption rates
- Rate limiting effectiveness
- User abandonment rates
- Security event frequency
- Content moderation accuracy

## 🔄 Security Updates

### Regular Updates
- **Dependencies**: Regular security updates
- **Security Rules**: Updated based on threat intelligence
- **CAPTCHA Logic**: Improved based on bot detection
- **Rate Limiting**: Adjusted based on usage patterns
- **MFA Enhancements**: Improved authentication methods
- **Content Moderation**: Updated filtering rules

### Security Audits
- **Code Reviews**: Regular security-focused reviews
- **Penetration Testing**: Periodic security assessments
- **Dependency Audits**: Automated vulnerability scanning
- **Security Dashboard**: Real-time security monitoring

## 🤝 Contributing

### Security Guidelines
1. **Follow Security Best Practices**: Always validate inputs
2. **Test Security Features**: Ensure new features don't compromise security
3. **Document Changes**: Update security documentation
4. **Code Review**: All changes require security review
5. **Security Testing**: Include security tests for new features

### Development Workflow
1. Fork the repository
2. Create a feature branch
3. Implement changes with security in mind
4. Add tests for security features
5. Submit a pull request

## 📚 Documentation

- **[Security Utilities](./src/utils/security.js)** - Security function documentation
- **[API Documentation](./src/services/)** - API service documentation
- **[Security Components](./src/components/)** - Security component documentation

## 🛡️ Security Features Checklist

### ✅ Implemented
- [x] Multi-factor authentication (TOTP, SMS, Email)
- [x] CAPTCHA protection for high-risk operations
- [x] Brute force protection with account lockout
- [x] Rate limiting and request throttling
- [x] Input validation and sanitization
- [x] XSS and CSRF protection
- [x] Password strength requirements
- [x] Session encryption and management
- [x] Role-based access control
- [x] Comprehensive activity logging
- [x] Secure token generation
- [x] Client-side data encryption
- [x] Content moderation system
- [x] Privacy controls and GDPR compliance
- [x] Security dashboard and monitoring
- [x] Security alerts and notifications
- [x] Security audit tools
- [x] API security middleware
- [x] Error boundaries and protection
- [x] Secure React context providers

### 🔄 Planned
- [ ] Advanced bot detection with machine learning
- [ ] Enhanced CAPTCHA types (reCAPTCHA v3, hCaptcha)
- [ ] Biometric authentication support
- [ ] Advanced threat detection algorithms
- [ ] Security analytics dashboard
- [ ] Automated security monitoring
- [ ] Zero-knowledge proof authentication
- [ ] Hardware security key support (WebAuthn)

## 📞 Support

For security-related issues or questions:
- **Security Issues**: Report via GitHub issues
- **Documentation**: Check the security utilities
- **Code Examples**: See the security components

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Security best practices from OWASP
- React security guidelines
- Modern web security standards
- Community security contributions
- Multi-factor authentication standards (TOTP, RFC 6238)

---

**⚠️ Security Notice**: This application implements comprehensive security measures, but security is an ongoing process. Regular updates and monitoring are essential for maintaining security standards. All security features are designed to protect user data and prevent unauthorized access while maintaining a smooth user experience.
