# Thrift Store Web Application

A modern, secure, and user-friendly thrift store web application built with React, Vite, and comprehensive security features.

## Features

### Core Functionality
- **User Authentication & Authorization** - Secure login/registration with role-based access
- **Product Management** - Add, edit, delete, and browse thrift items
- **Admin Dashboard** - Comprehensive admin panel for store management
- **Real-time Notifications** - Socket.io powered notifications
- **Responsive Design** - Mobile-first approach with Tailwind CSS
- **Dark Mode Support** - Theme switching capability

### Security Features
- **Multi-layered Security Architecture** - Comprehensive protection at every level
- **CAPTCHA Protection** - Smart CAPTCHA implementation for high-risk operations
- **Brute Force Protection** - Account lockout after failed attempts
- **Rate Limiting** - Request throttling to prevent abuse
- **Input Validation & Sanitization** - XSS and injection attack prevention
- **Password Security** - Advanced password strength requirements
- **Session Management** - Secure session handling with encryption
- **Activity Logging** - Comprehensive security event tracking

## Security Features Implemented

### 1. **Authentication & Authorization Security**

#### CAPTCHA Protection
- **Admin Login CAPTCHA**: Required after 2 failed attempts
- **User Registration CAPTCHA**: Triggered on registration failures
- **Smart Triggering**: Only shows when security threats are detected
- **Reusable Component**: Consistent CAPTCHA implementation across the app

#### Brute Force Protection
- **Maximum Attempts**: 5 failed login attempts
- **Lockout Duration**: 15-minute account lockout
- **OTP Protection**: Separate, more lenient protection for OTP verification
- **Automatic Reset**: Lockout clears after successful login

#### Password Security
- **Strength Requirements**:
  - Minimum 8 characters, maximum 128 characters
  - Must contain uppercase, lowercase, numbers, and special characters
  - No common patterns or sequential characters
  - Real-time strength indicator
- **Client-side Hashing**: SHA-256 hashing before server transmission
- **Password Validation**: Comprehensive validation with detailed feedback

### 2. **Rate Limiting & Request Protection**

#### Request Throttling
- **General Rate Limit**: 100 requests per 15 minutes
- **OTP Rate Limit**: 20 requests per 10 minutes (more lenient)
- **IP-based Tracking**: Request tracking by identifier
- **Automatic Reset**: Limits reset after time window

#### Input Security
- **Input Sanitization**: Removes malicious HTML, scripts, and event handlers
- **XSS Prevention**: HTML escaping and content filtering
- **CSRF Protection**: CSRF token generation and validation
- **Data Validation**: Comprehensive validation for all user inputs

### 3. **Session & Data Security**

#### Session Management
- **Encrypted Sessions**: AES encryption for session data
- **Session Timeout**: 30-minute automatic timeout
- **Secure Storage**: Encrypted localStorage usage
- **Activity Tracking**: Last activity monitoring

#### Data Protection
- **Client-side Encryption**: AES encryption for sensitive data
- **Secure Token Generation**: Cryptographically secure tokens
- **Data Sanitization**: All user inputs are sanitized
- **Content Security Policy**: Strict CSP headers

### 4. **Role-Based Access Control (RBAC)**

#### User Roles
- **User**: Basic permissions for product management
- **Admin**: Full system access and management
- **Moderator**: Content moderation capabilities

#### Permission System
- **Granular Permissions**: Fine-grained access control
- **Inheritance**: Role-based permission inheritance
- **Dynamic Checking**: Real-time permission validation

### 5. **Monitoring & Logging**

#### Activity Logging
- **Comprehensive Tracking**: All security events logged
- **User Actions**: Login, registration, password changes
- **Admin Actions**: User management, system changes
- **Security Events**: Failed attempts, suspicious activity

#### Security Analytics
- **Real-time Monitoring**: Live security event tracking
- **Pattern Detection**: Suspicious behavior identification
- **Performance Metrics**: CAPTCHA effectiveness tracking

## Technical Stack

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

### Development Tools
- **ESLint** - Code linting and quality
- **Playwright** - End-to-end testing
- **PostCSS** - CSS processing

## Project Structure

```
thrift_store_web/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── Captcha.jsx     # CAPTCHA component
│   │   ├── ProtectedRoute.jsx # Route protection
│   │   └── ...
│   ├── context/            # React context providers
│   │   ├── AuthContext.jsx # Authentication state
│   │   └── ...
│   ├── core/               # Core application logic
│   │   ├── private/        # Protected routes
│   │   │   ├── admin/      # Admin functionality
│   │   │   └── users/      # User functionality
│   │   └── public/         # Public routes
│   ├── services/           # API services
│   ├── utils/              # Utility functions
│   │   └── security.js     # Security utilities
│   └── socket/             # Socket.io configuration
├── tests/                  # Test files
├── docs/                   # Documentation
│   └── CAPTCHA_GUIDELINES.md
└── public/                 # Static assets
```

## Getting Started

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

## Configuration

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
```

### Environment Variables

```bash
# Security
VITE_ENCRYPTION_KEY=your-secret-key
VITE_API_BASE_URL=https://localhost:3000/api

# Features
VITE_ENABLE_CAPTCHA=true
VITE_ENABLE_ANALYTICS=true
```

## Testing

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
3. **Input Validation**: Test with malicious inputs
4. **Session Security**: Test session timeout and encryption

## Security Monitoring

### Activity Logs
Security events are logged and can be monitored:
- Login attempts (success/failure)
- Registration events
- Admin actions
- Suspicious activity

### Performance Metrics
- CAPTCHA success rates
- Rate limiting effectiveness
- User abandonment rates
- Security event frequency

## Security Updates

### Regular Updates
- **Dependencies**: Regular security updates
- **Security Rules**: Updated based on threat intelligence
- **CAPTCHA Logic**: Improved based on bot detection
- **Rate Limiting**: Adjusted based on usage patterns

### Security Audits
- **Code Reviews**: Regular security-focused reviews
- **Penetration Testing**: Periodic security assessments
- **Dependency Audits**: Automated vulnerability scanning

## Contributing

### Security Guidelines
1. **Follow Security Best Practices**: Always validate inputs
2. **Test Security Features**: Ensure new features don't compromise security
3. **Document Changes**: Update security documentation
4. **Code Review**: All changes require security review

### Development Workflow
1. Fork the repository
2. Create a feature branch
3. Implement changes with security in mind
4. Add tests for security features
5. Submit a pull request

## Documentation

- **[CAPTCHA Guidelines](./docs/CAPTCHA_GUIDELINES.md)** - Comprehensive CAPTCHA implementation guide
- **[Security Utilities](./src/utils/security.js)** - Security function documentation
- **[API Documentation](./src/services/)** - API service documentation

## Security Features Checklist

### Implemented
- [x] Multi-factor authentication (OTP)
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

### Planned
- [ ] Advanced bot detection
- [ ] Machine learning-based threat detection
- [ ] Enhanced CAPTCHA types
- [ ] Security analytics dashboard
- [ ] Automated security monitoring

## Support

For security-related issues or questions:
- **Security Issues**: Report via GitHub issues
- **Documentation**: Check the docs folder
- **Code Examples**: See the security utilities

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Security best practices from OWASP
- React security guidelines
- Modern web security standards
- Community security contributions

---

**Security Notice**: This application implements comprehensive security measures, but security is an ongoing process. Regular updates and monitoring are essential for maintaining security standards.
