import React, { useEffect, useState } from 'react';
import { FaRefresh, FaShieldAlt } from 'react-icons/fa';

const Captcha = ({
    required = false,
    onCaptchaChange,
    theme = 'default',
    size = 'medium',
    className = ''
}) => {
    const [captchaValue, setCaptchaValue] = useState('');
    const [captchaImage, setCaptchaImage] = useState('');
    const [isVisible, setIsVisible] = useState(required);

    // Generate CAPTCHA
    const generateCaptcha = () => {
        const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        let result = '';
        for (let i = 0; i < 6; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    };

    // Initialize CAPTCHA
    useEffect(() => {
        if (isVisible) {
            setCaptchaImage(generateCaptcha());
        }
    }, [isVisible]);

    // Handle CAPTCHA value change
    const handleCaptchaChange = (value) => {
        setCaptchaValue(value);
        if (onCaptchaChange) {
            onCaptchaChange(value, value.toUpperCase() === captchaImage);
        }
    };

    // Refresh CAPTCHA
    const refreshCaptcha = () => {
        const newCaptcha = generateCaptcha();
        setCaptchaImage(newCaptcha);
        setCaptchaValue('');
        if (onCaptchaChange) {
            onCaptchaChange('', false);
        }
    };

    // Show CAPTCHA
    const showCaptcha = () => {
        setIsVisible(true);
        setCaptchaImage(generateCaptcha());
    };

    // Hide CAPTCHA
    const hideCaptcha = () => {
        setIsVisible(false);
        setCaptchaValue('');
        if (onCaptchaChange) {
            onCaptchaChange('', true);
        }
    };

    // Theme styles
    const getThemeStyles = () => {
        switch (theme) {
            case 'amber':
                return {
                    container: 'bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200',
                    text: 'text-amber-700',
                    button: 'bg-amber-100 hover:bg-amber-200 text-amber-600 hover:text-amber-700',
                    input: 'focus:border-amber-500'
                };
            case 'purple':
                return {
                    container: 'bg-gradient-to-r from-purple-50 to-indigo-50 border-2 border-purple-200',
                    text: 'text-purple-700',
                    button: 'bg-purple-100 hover:bg-purple-200 text-purple-600 hover:text-purple-700',
                    input: 'focus:border-purple-500'
                };
            default:
                return {
                    container: 'bg-gradient-to-r from-gray-50 to-slate-50 border-2 border-gray-200',
                    text: 'text-gray-700',
                    button: 'bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-700',
                    input: 'focus:border-gray-500'
                };
        }
    };

    // Size styles
    const getSizeStyles = () => {
        switch (size) {
            case 'small':
                return {
                    container: 'p-2 text-sm',
                    text: 'text-lg',
                    input: 'px-4 py-2 text-sm'
                };
            case 'large':
                return {
                    container: 'p-6 text-lg',
                    text: 'text-3xl',
                    input: 'px-8 py-6 text-lg'
                };
            default:
                return {
                    container: 'p-4 text-base',
                    text: 'text-2xl',
                    input: 'px-6 py-4 text-base'
                };
        }
    };

    const themeStyles = getThemeStyles();
    const sizeStyles = getSizeStyles();

    if (!isVisible && !required) {
        return (
            <div className={`text-center ${className}`}>
                <button
                    type="button"
                    onClick={showCaptcha}
                    className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-lg transition-colors duration-200"
                >
                    <FaShieldAlt />
                    <span>Enable Security Verification</span>
                </button>
            </div>
        );
    }

    return (
        <div className={`space-y-4 ${className}`}>
            <div className="text-center">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Security Verification
                </label>
                <div className="flex items-center justify-center space-x-3">
                    <div className={`${themeStyles.container} ${sizeStyles.container} rounded-2xl text-center font-mono ${sizeStyles.text} font-bold tracking-wider ${themeStyles.text} shadow-lg`}>
                        {captchaImage}
                    </div>
                    <button
                        type="button"
                        onClick={refreshCaptcha}
                        className={`p-3 ${themeStyles.button} rounded-2xl transition-colors duration-200`}
                        title="Refresh CAPTCHA"
                    >
                        <FaRefresh className="text-xl" />
                    </button>
                </div>
            </div>

            <div className="relative group">
                <input
                    type="text"
                    placeholder="Enter the code above"
                    value={captchaValue}
                    onChange={(e) => handleCaptchaChange(e.target.value)}
                    className={`w-full ${sizeStyles.input} pl-14 border-2 border-gray-200 rounded-2xl focus:outline-none ${themeStyles.input} transition-all duration-300 bg-white/80 backdrop-blur-sm group-hover:bg-white`}
                    required={required}
                />
                <FaShieldAlt className="absolute left-5 top-1/2 -translate-y-1/2 text-amber-500 text-xl" />
            </div>

            {!required && (
                <div className="text-center">
                    <button
                        type="button"
                        onClick={hideCaptcha}
                        className="text-sm text-gray-500 hover:text-gray-700 underline"
                    >
                        Disable Security Verification
                    </button>
                </div>
            )}
        </div>
    );
};

export default Captcha; 