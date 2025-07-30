import React from 'react';
import { FaCheck, FaExclamationTriangle, FaTimes } from 'react-icons/fa';
import { assessPasswordStrength } from '../utils/security';

const PasswordStrengthIndicator = ({ password, showDetails = true }) => {
    const strength = assessPasswordStrength(password);

    const getStrengthColor = () => {
        switch (strength.strength) {
            case 'very-strong':
                return 'bg-green-500';
            case 'strong':
                return 'bg-green-400';
            case 'medium':
                return 'bg-yellow-500';
            case 'weak':
                return 'bg-orange-500';
            case 'very-weak':
                return 'bg-red-500';
            default:
                return 'bg-gray-300';
        }
    };

    const getStrengthText = () => {
        switch (strength.strength) {
            case 'very-strong':
                return 'Very Strong';
            case 'strong':
                return 'Strong';
            case 'medium':
                return 'Medium';
            case 'weak':
                return 'Weak';
            case 'very-weak':
                return 'Very Weak';
            default:
                return 'Enter Password';
        }
    };

    const getStrengthWidth = () => {
        return `${(strength.score / strength.maxScore) * 100}%`;
    };

    return (
        <div className="space-y-3">
            {/* Strength Bar */}
            <div className="space-y-2">
                <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Password Strength</span>
                    <span className={`text-sm font-semibold px-2 py-1 rounded-full ${strength.strength === 'very-strong' || strength.strength === 'strong'
                            ? 'text-green-700 bg-green-100'
                            : strength.strength === 'medium'
                                ? 'text-yellow-700 bg-yellow-100'
                                : 'text-red-700 bg-red-100'
                        }`}>
                        {getStrengthText()}
                    </span>
                </div>

                <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                        className={`h-2 rounded-full transition-all duration-300 ${getStrengthColor()}`}
                        style={{ width: getStrengthWidth() }}
                    />
                </div>

                <p className="text-xs text-gray-600">{strength.message}</p>
            </div>

            {/* Detailed Requirements */}
            {showDetails && (
                <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-700">Requirements:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <div className="flex items-center space-x-2">
                            {strength.checks.length ? (
                                <FaCheck className="text-green-500 text-xs" />
                            ) : (
                                <FaTimes className="text-red-500 text-xs" />
                            )}
                            <span className={`text-xs ${strength.checks.length ? 'text-green-600' : 'text-red-600'}`}>
                                At least 8 characters
                            </span>
                        </div>

                        <div className="flex items-center space-x-2">
                            {strength.checks.uppercase ? (
                                <FaCheck className="text-green-500 text-xs" />
                            ) : (
                                <FaTimes className="text-red-500 text-xs" />
                            )}
                            <span className={`text-xs ${strength.checks.uppercase ? 'text-green-600' : 'text-red-600'}`}>
                                One uppercase letter
                            </span>
                        </div>

                        <div className="flex items-center space-x-2">
                            {strength.checks.lowercase ? (
                                <FaCheck className="text-green-500 text-xs" />
                            ) : (
                                <FaTimes className="text-red-500 text-xs" />
                            )}
                            <span className={`text-xs ${strength.checks.lowercase ? 'text-green-600' : 'text-red-600'}`}>
                                One lowercase letter
                            </span>
                        </div>

                        <div className="flex items-center space-x-2">
                            {strength.checks.numbers ? (
                                <FaCheck className="text-green-500 text-xs" />
                            ) : (
                                <FaTimes className="text-red-500 text-xs" />
                            )}
                            <span className={`text-xs ${strength.checks.numbers ? 'text-green-600' : 'text-red-600'}`}>
                                One number
                            </span>
                        </div>

                        <div className="flex items-center space-x-2">
                            {strength.checks.specialChars ? (
                                <FaCheck className="text-green-500 text-xs" />
                            ) : (
                                <FaTimes className="text-red-500 text-xs" />
                            )}
                            <span className={`text-xs ${strength.checks.specialChars ? 'text-green-600' : 'text-red-600'}`}>
                                One special character
                            </span>
                        </div>

                        <div className="flex items-center space-x-2">
                            {strength.checks.noCommonPatterns ? (
                                <FaCheck className="text-green-500 text-xs" />
                            ) : (
                                <FaExclamationTriangle className="text-orange-500 text-xs" />
                            )}
                            <span className={`text-xs ${strength.checks.noCommonPatterns ? 'text-green-600' : 'text-orange-600'}`}>
                                No common patterns
                            </span>
                        </div>

                        <div className="flex items-center space-x-2">
                            {strength.checks.noRepeatingChars ? (
                                <FaCheck className="text-green-500 text-xs" />
                            ) : (
                                <FaExclamationTriangle className="text-orange-500 text-xs" />
                            )}
                            <span className={`text-xs ${strength.checks.noRepeatingChars ? 'text-green-600' : 'text-orange-600'}`}>
                                No repeating characters
                            </span>
                        </div>

                        <div className="flex items-center space-x-2">
                            {strength.checks.noSequentialChars ? (
                                <FaCheck className="text-green-500 text-xs" />
                            ) : (
                                <FaExclamationTriangle className="text-orange-500 text-xs" />
                            )}
                            <span className={`text-xs ${strength.checks.noSequentialChars ? 'text-green-600' : 'text-orange-600'}`}>
                                No sequential characters
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* Security Tips */}
            {password.length > 0 && strength.strength !== 'very-strong' && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <h5 className="text-sm font-medium text-amber-800 mb-2">Security Tips:</h5>
                    <ul className="text-xs text-amber-700 space-y-1">
                        <li>• Use a mix of letters, numbers, and symbols</li>
                        <li>• Avoid personal information like names or birthdays</li>
                        <li>• Consider using a passphrase for better security</li>
                        <li>• Use unique passwords for each account</li>
                    </ul>
                </div>
            )}
        </div>
    );
};

export default PasswordStrengthIndicator; 