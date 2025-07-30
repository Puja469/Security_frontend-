import React, { useEffect, useState } from 'react';
import { FaEnvelope, FaMobile, FaQrcode, FaShieldAlt } from 'react-icons/fa';
import { generateSecureToken } from '../utils/security';

const MFAVerification = ({
    onVerificationSuccess,
    onVerificationFailure,
    mfaType = 'totp', // 'totp', 'sms', 'email'
    userId,
    email,
    phone
}) => {
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [attempts, setAttempts] = useState(0);
    const [isLocked, setIsLocked] = useState(false);
    const [lockoutTime, setLockoutTime] = useState(0);
    const [qrCode, setQrCode] = useState('');
    const [secretKey, setSecretKey] = useState('');

    const MAX_ATTEMPTS = 3;
    const LOCKOUT_DURATION = 5 * 60 * 1000; // 5 minutes

    useEffect(() => {
        if (mfaType === 'totp') {
            generateTOTPSecret();
        }
    }, [mfaType]);

    useEffect(() => {
        if (isLocked) {
            const timer = setTimeout(() => {
                setIsLocked(false);
                setAttempts(0);
                setLockoutTime(0);
            }, LOCKOUT_DURATION);
            return () => clearTimeout(timer);
        }
    }, [isLocked]);

    const generateTOTPSecret = () => {
        const secret = generateSecureToken(32);
        setSecretKey(secret);

        // Generate QR code for TOTP apps
        const qrData = `otpauth://totp/ThriftStore:${email}?secret=${secret}&issuer=ThriftStore&algorithm=SHA1&digits=6&period=30`;
        setQrCode(qrData);
    };

    const handleOtpChange = (index, value) => {
        if (value.length > 1) return; // Only allow single digit

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        // Auto-focus next input
        if (value && index < 5) {
            const nextInput = document.getElementById(`otp-${index + 1}`);
            if (nextInput) nextInput.focus();
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            const prevInput = document.getElementById(`otp-${index - 1}`);
            if (prevInput) prevInput.focus();
        }
    };

    const sendOTP = async () => {
        setIsLoading(true);
        setError('');

        try {
            const endpoint = mfaType === 'sms' ? '/api/mfa/send-sms' : '/api/mfa/send-email';
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId,
                    email: mfaType === 'email' ? email : undefined,
                    phone: mfaType === 'sms' ? phone : undefined,
                }),
            });

            if (response.ok) {
                // Show success message
                console.log('OTP sent successfully');
            } else {
                throw new Error('Failed to send OTP');
            }
        } catch (error) {
            setError('Failed to send OTP. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const verifyOTP = async () => {
        if (isLocked) {
            setError(`Account is locked. Please wait ${Math.ceil(lockoutTime / 1000)} seconds.`);
            return;
        }

        const otpString = otp.join('');
        if (otpString.length !== 6) {
            setError('Please enter a 6-digit OTP');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const response = await fetch('/api/mfa/verify', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId,
                    otp: otpString,
                    mfaType,
                    secretKey: mfaType === 'totp' ? secretKey : undefined,
                }),
            });

            if (response.ok) {
                const data = await response.json();
                onVerificationSuccess(data);
            } else {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Invalid OTP');
            }
        } catch (error) {
            setError(error.message);
            setAttempts(prev => prev + 1);

            if (attempts + 1 >= MAX_ATTEMPTS) {
                setIsLocked(true);
                setLockoutTime(LOCKOUT_DURATION);
                setError('Too many failed attempts. Account locked for 5 minutes.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const resendOTP = () => {
        setOtp(['', '', '', '', '', '']);
        setError('');
        sendOTP();
    };

    const getMFAIcon = () => {
        switch (mfaType) {
            case 'totp':
                return <FaQrcode className="text-3xl text-amber-600" />;
            case 'sms':
                return <FaMobile className="text-3xl text-amber-600" />;
            case 'email':
                return <FaEnvelope className="text-3xl text-amber-600" />;
            default:
                return <FaShieldAlt className="text-3xl text-amber-600" />;
        }
    };

    const getMFATitle = () => {
        switch (mfaType) {
            case 'totp':
                return 'Authenticator App';
            case 'sms':
                return 'SMS Verification';
            case 'email':
                return 'Email Verification';
            default:
                return 'Two-Factor Authentication';
        }
    };

    const getMFADescription = () => {
        switch (mfaType) {
            case 'totp':
                return 'Enter the 6-digit code from your authenticator app';
            case 'sms':
                return `Enter the 6-digit code sent to ${phone}`;
            case 'email':
                return `Enter the 6-digit code sent to ${email}`;
            default:
                return 'Enter the 6-digit verification code';
        }
    };

    return (
        <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl p-8 border border-amber-200">
            <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-amber-100 to-orange-100 rounded-full mb-4">
                    {getMFAIcon()}
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">{getMFATitle()}</h2>
                <p className="text-gray-600">{getMFADescription()}</p>
            </div>

            {/* TOTP Setup for Authenticator Apps */}
            {mfaType === 'totp' && qrCode && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Setup Instructions:</h3>
                    <ol className="text-xs text-gray-600 space-y-2 mb-4">
                        <li>1. Download an authenticator app (Google Authenticator, Authy, etc.)</li>
                        <li>2. Scan the QR code or enter the secret key manually</li>
                        <li>3. Enter the 6-digit code from your app below</li>
                    </ol>

                    <div className="text-center">
                        <div className="inline-block p-2 bg-white rounded border">
                            {/* QR Code would be rendered here */}
                            <div className="w-32 h-32 bg-gray-200 rounded flex items-center justify-center">
                                <span className="text-xs text-gray-500">QR Code</span>
                            </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">Secret Key: {secretKey}</p>
                    </div>
                </div>
            )}

            {/* OTP Input */}
            <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                    Enter 6-digit code
                </label>
                <div className="flex justify-center space-x-2">
                    {otp.map((digit, index) => (
                        <input
                            key={index}
                            id={`otp-${index}`}
                            type="text"
                            maxLength="1"
                            value={digit}
                            onChange={(e) => handleOtpChange(index, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(index, e)}
                            className="w-12 h-12 text-center text-lg font-semibold border-2 border-gray-300 rounded-lg focus:border-amber-500 focus:outline-none transition-colors"
                            disabled={isLocked}
                        />
                    ))}
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{error}</p>
                </div>
            )}

            {/* Attempts Counter */}
            {attempts > 0 && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-700">
                        Failed attempts: {attempts}/{MAX_ATTEMPTS}
                    </p>
                </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
                <button
                    onClick={verifyOTP}
                    disabled={isLoading || isLocked || otp.join('').length !== 6}
                    className="w-full py-3 bg-gradient-to-r from-amber-600 to-orange-600 text-white font-semibold rounded-xl hover:from-amber-700 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                >
                    {isLoading ? 'Verifying...' : 'Verify Code'}
                </button>

                {mfaType !== 'totp' && (
                    <button
                        onClick={resendOTP}
                        disabled={isLoading}
                        className="w-full py-2 text-amber-600 hover:text-amber-700 font-medium text-sm transition-colors"
                    >
                        Resend Code
                    </button>
                )}
            </div>

            {/* Security Notice */}
            <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-blue-700">
                    <FaShieldAlt className="inline mr-1" />
                    This extra step helps protect your account from unauthorized access.
                </p>
            </div>
        </div>
    );
};

export default MFAVerification; 