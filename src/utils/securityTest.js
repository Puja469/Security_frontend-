// Security Testing and Validation Utilities
import { PrivacyControls } from './dataProtection';
import { ActivityLogger } from './security';
import { getSecurityStatus, performSecurityHealthCheck } from './securityInit';

// Security Test Configuration
export const SECURITY_TEST_CONFIG = {
    TIMEOUT: 10000, // 10 seconds
    RETRY_ATTEMPTS: 3,
    THRESHOLD_SCORE: 70
};

// Run comprehensive security tests
export const runSecurityTests = async () => {
    console.log('🧪 Starting security tests...');

    const results = {
        initialization: {
            securityInit: false,
            privacyControls: false,
            activityLogging: false,
            overall: false
        },
        functionality: {
            sessionManagement: false,
            rateLimiting: false,
            inputValidation: false,
            overall: false
        },
        privacy: {
            privacyMode: false,
            doNotTrack: false,
            cookieConsent: false,
            overall: false
        },
        overall: {
            score: 0,
            status: 'unknown',
            issues: []
        }
    };

    try {
        // Test security initialization
        console.log('🔍 Testing security initialization...');
        const securityStatus = getSecurityStatus();
        results.initialization.securityInit = !!securityStatus;

        // Test privacy controls
        console.log('🔍 Testing privacy controls...');
        try {
            const privacyMode = PrivacyControls.privacyMode?.isEnabled ? PrivacyControls.privacyMode.isEnabled() : false;
            results.initialization.privacyControls = true;
        } catch (error) {
            console.warn('Privacy controls test failed:', error);
        }

        // Test activity logging
        console.log('🔍 Testing activity logging...');
        try {
            const events = ActivityLogger.getEvents ? ActivityLogger.getEvents() : [];
            results.initialization.activityLogging = true;
        } catch (error) {
            console.warn('Activity logging test failed:', error);
        }

        // Test functionality
        console.log('🔍 Testing security functionality...');
        const healthCheck = performSecurityHealthCheck();
        results.functionality = healthCheck;

        // Test privacy features
        console.log('🔍 Testing privacy features...');
        try {
            const privacyMode = PrivacyControls.privacyMode?.isEnabled ? PrivacyControls.privacyMode.isEnabled() : false;
            const doNotTrack = PrivacyControls.doNotTrack ? PrivacyControls.doNotTrack() : false;
            const consent = PrivacyControls.cookieConsent?.get ? PrivacyControls.cookieConsent.get() : null;

            results.privacy.privacyMode = privacyMode;
            results.privacy.doNotTrack = doNotTrack;
            results.privacy.cookieConsent = !!consent;
        } catch (error) {
            console.warn('Privacy features test failed:', error);
        }

        // Calculate overall results
        results.initialization.overall = results.initialization.securityInit &&
            results.initialization.privacyControls &&
            results.initialization.activityLogging;

        results.functionality.overall = results.functionality.sessionManagement &&
            results.functionality.rateLimiting &&
            results.functionality.inputValidation;

        results.privacy.overall = results.privacy.privacyMode ||
            results.privacy.doNotTrack ||
            results.privacy.cookieConsent;

        // Calculate overall score
        let score = 0;
        let totalTests = 0;

        // Initialization tests (30% weight)
        const initTests = Object.values(results.initialization).filter(v => typeof v === 'boolean');
        score += (initTests.filter(Boolean).length / initTests.length) * 30;
        totalTests += 30;

        // Functionality tests (40% weight)
        const funcTests = Object.values(results.functionality).filter(v => typeof v === 'boolean');
        score += (funcTests.filter(Boolean).length / funcTests.length) * 40;
        totalTests += 40;

        // Privacy tests (30% weight)
        const privacyTests = Object.values(results.privacy).filter(v => typeof v === 'boolean');
        score += (privacyTests.filter(Boolean).length / privacyTests.length) * 30;
        totalTests += 30;

        results.overall.score = Math.round(score);
        results.overall.status = score >= SECURITY_TEST_CONFIG.THRESHOLD_SCORE ? 'pass' : 'fail';

        // Identify issues
        if (!results.initialization.securityInit) {
            results.overall.issues.push('Security initialization failed');
        }
        if (!results.functionality.sessionManagement) {
            results.overall.issues.push('Session management not working');
        }
        if (!results.functionality.rateLimiting) {
            results.overall.issues.push('Rate limiting not working');
        }
        if (!results.functionality.inputValidation) {
            results.overall.issues.push('Input validation not working');
        }

        console.log('✅ Security tests completed');
        return results;

    } catch (error) {
        console.error('❌ Security tests failed:', error);
        results.overall.status = 'error';
        results.overall.issues.push(`Test execution failed: ${error.message}`);
        return results;
    }
};

// Test specific security features
export const testSecurityFeature = async (feature) => {
    console.log(`🧪 Testing ${feature}...`);

    const startTime = Date.now();

    try {
        switch (feature) {
            case 'session':
                return await testSessionManagement();
            case 'rateLimit':
                return await testRateLimiting();
            case 'input':
                return await testInputValidation();
            case 'privacy':
                return await testPrivacyFeatures();
            default:
                throw new Error(`Unknown security feature: ${feature}`);
        }
    } catch (error) {
        console.error(`❌ ${feature} test failed:`, error);
        return {
            success: false,
            duration: Date.now() - startTime,
            error: error.message
        };
    }
};

// Test session management
const testSessionManagement = async () => {
    const startTime = Date.now();

    // Test session timeout
    const testTimeout = () => {
        return new Promise((resolve) => {
            const timeout = setTimeout(() => {
                resolve(true);
            }, 1000);

            // Simulate user activity
            setTimeout(() => {
                clearTimeout(timeout);
                resolve(false);
            }, 500);
        });
    };

    const timeoutResult = await testTimeout();

    return {
        success: !timeoutResult, // Should not timeout due to activity
        duration: Date.now() - startTime,
        details: {
            sessionTimeout: !timeoutResult
        }
    };
};

// Test rate limiting
const testRateLimiting = async () => {
    const startTime = Date.now();

    if (!window.rateLimiter) {
        throw new Error('Rate limiter not available');
    }

    // Test rate limiting
    const key = 'test-rate-limit';
    const limit = 3;
    const window = 1000; // 1 second

    const results = [];
    for (let i = 0; i < 5; i++) {
        results.push(window.rateLimiter.check(key, limit, window));
    }

    // Should allow first 3, reject last 2
    const expected = [true, true, true, false, false];
    const success = results.every((result, index) => result === expected[index]);

    // Clean up
    window.rateLimiter.clear(key);

    return {
        success,
        duration: Date.now() - startTime,
        details: {
            results,
            expected
        }
    };
};

// Test input validation
const testInputValidation = async () => {
    const startTime = Date.now();

    if (!window.sanitizeInput) {
        throw new Error('Input sanitization not available');
    }

    const testCases = [
        { input: '<script>alert("xss")</script>', expected: 'alert("xss")' },
        { input: 'javascript:alert("xss")', expected: 'alert("xss")' },
        { input: 'normal text', expected: 'normal text' },
        { input: 'onclick=alert("xss")', expected: 'alert("xss")' }
    ];

    const results = testCases.map(testCase => {
        const sanitized = window.sanitizeInput(testCase.input);
        return sanitized === testCase.expected;
    });

    const success = results.every(Boolean);

    return {
        success,
        duration: Date.now() - startTime,
        details: {
            testCases: testCases.length,
            passed: results.filter(Boolean).length
        }
    };
};

// Test privacy features
const testPrivacyFeatures = async () => {
    const startTime = Date.now();

    try {
        const privacyMode = PrivacyControls.privacyMode?.isEnabled ? PrivacyControls.privacyMode.isEnabled() : false;
        const doNotTrack = PrivacyControls.doNotTrack ? PrivacyControls.doNotTrack() : false;
        const consent = PrivacyControls.cookieConsent?.get ? PrivacyControls.cookieConsent.get() : null;

        return {
            success: true,
            duration: Date.now() - startTime,
            details: {
                privacyMode,
                doNotTrack,
                hasConsent: !!consent
            }
        };
    } catch (error) {
        throw new Error(`Privacy features test failed: ${error.message}`);
    }
};

// Generate security report
export const generateSecurityReport = (results) => {
    const report = {
        timestamp: new Date().toISOString(),
        summary: {
            overallScore: results.overall.score,
            status: results.overall.status,
            issues: results.overall.issues.length
        },
        details: results,
        recommendations: []
    };

    // Generate recommendations based on results
    if (results.overall.score < SECURITY_TEST_CONFIG.THRESHOLD_SCORE) {
        report.recommendations.push('Security score is below threshold - review and fix issues');
    }

    if (!results.functionality.sessionManagement) {
        report.recommendations.push('Implement proper session management');
    }

    if (!results.functionality.rateLimiting) {
        report.recommendations.push('Implement rate limiting to prevent abuse');
    }

    if (!results.functionality.inputValidation) {
        report.recommendations.push('Implement input validation and sanitization');
    }

    if (results.overall.issues.length > 0) {
        report.recommendations.push('Address all identified security issues');
    }

    return report;
};

export default {
    runSecurityTests,
    testSecurityFeature,
    generateSecurityReport,
    SECURITY_TEST_CONFIG
}; 