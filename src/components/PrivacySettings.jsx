import React, { useEffect, useState } from 'react';
import {
    FaBell,
    FaChartBar,
    FaCheck,
    FaCookieBite,
    FaDownload,
    FaExclamationTriangle,
    FaEyeSlash,
    FaInfoCircle,
    FaLock,
    FaShieldAlt,
    FaTimes,
    FaTrash,
    FaUserSecret
} from 'react-icons/fa';
import {
    DataProtection,
    PrivacyControls
} from '../utils/dataProtection';

const PrivacySettings = () => {
    const [activeTab, setActiveTab] = useState('consent');
    const [consent, setConsent] = useState({
        analytics: false,
        marketing: false,
        necessary: true
    });
    const [privacyMode, setPrivacyMode] = useState(false);
    const [showExportConfirm, setShowExportConfirm] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [exportData, setExportData] = useState(null);
    const [privacyScore, setPrivacyScore] = useState(0);

    useEffect(() => {
        // Load existing consent
        const existingConsent = PrivacyControls.cookieConsent.get();
        if (existingConsent) {
            setConsent(existingConsent);
        }

        // Check privacy mode
        setPrivacyMode(PrivacyControls.privacyMode.isEnabled());

        // Calculate privacy score
        calculatePrivacyScore();
    }, []);

    const calculatePrivacyScore = () => {
        let score = 100;

        // Deduct points for each consent type
        if (consent.analytics) score -= 20;
        if (consent.marketing) score -= 15;

        // Add points for privacy mode
        if (privacyMode) score += 10;

        // Add points for Do Not Track
        if (PrivacyControls.doNotTrack()) score += 15;

        setPrivacyScore(Math.max(0, Math.min(100, score)));
    };

    const handleConsentChange = (type, value) => {
        const newConsent = { ...consent, [type]: value };
        setConsent(newConsent);
        PrivacyControls.cookieConsent.set(newConsent);
        calculatePrivacyScore();
    };

    const handlePrivacyModeToggle = () => {
        if (privacyMode) {
            PrivacyControls.privacyMode.disable();
            setPrivacyMode(false);
        } else {
            PrivacyControls.privacyMode.enable();
            setPrivacyMode(true);
        }
        calculatePrivacyScore();
    };

    const handleExportData = () => {
        const userId = localStorage.getItem('userId');
        if (userId) {
            const data = DataProtection.exportUserData(userId);
            setExportData(data);
            setShowExportConfirm(false);

            // Create downloadable file
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `user-data-${userId}-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
    };

    const handleDeleteData = () => {
        const userId = localStorage.getItem('userId');
        if (userId) {
            const result = DataProtection.deleteUserData(userId);
            setShowDeleteConfirm(false);

            // Clear all local data
            localStorage.clear();
            sessionStorage.clear();

            // Redirect to home page
            window.location.href = '/';
        }
    };

    const getPrivacyScoreColor = (score) => {
        if (score >= 80) return 'text-green-600';
        if (score >= 60) return 'text-yellow-600';
        return 'text-red-600';
    };

    const getPrivacyScoreMessage = (score) => {
        if (score >= 80) return 'Excellent privacy protection';
        if (score >= 60) return 'Good privacy protection';
        return 'Privacy protection needs improvement';
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 p-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 mb-8 border border-amber-200/30">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <div className="w-16 h-16 bg-gradient-to-r from-amber-600 to-orange-600 rounded-2xl flex items-center justify-center">
                                <FaShieldAlt className="text-3xl text-white" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-800">Privacy Settings</h1>
                                <p className="text-gray-600">Manage your data and privacy preferences</p>
                            </div>
                        </div>

                        {/* Privacy Score */}
                        <div className="text-center">
                            <div className={`text-4xl font-bold ${getPrivacyScoreColor(privacyScore)}`}>
                                {privacyScore}
                            </div>
                            <div className="text-sm text-gray-600">Privacy Score</div>
                            <div className={`text-xs ${getPrivacyScoreColor(privacyScore)}`}>
                                {getPrivacyScoreMessage(privacyScore)}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Sidebar */}
                    <div className="lg:col-span-1">
                        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-6 border border-amber-200/30">
                            <nav className="space-y-2">
                                {[
                                    { id: 'consent', label: 'Cookie Consent', icon: FaCookieBite },
                                    { id: 'privacy', label: 'Privacy Mode', icon: FaUserSecret },
                                    { id: 'data', label: 'Data Management', icon: FaDownload },
                                    { id: 'analytics', label: 'Analytics', icon: FaChartBar }
                                ].map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`w-full flex items-center space-x-3 p-4 rounded-2xl transition-all duration-300 ${activeTab === tab.id
                                                ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-lg'
                                                : 'text-gray-600 hover:bg-amber-50 hover:text-amber-600'
                                            }`}
                                    >
                                        <tab.icon className="text-xl" />
                                        <span className="font-medium">{tab.label}</span>
                                    </button>
                                ))}
                            </nav>
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="lg:col-span-3">
                        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-amber-200/30">
                            {activeTab === 'consent' && (
                                <div className="space-y-8">
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-800 mb-4">Cookie Consent</h2>
                                        <p className="text-gray-600 mb-6">
                                            Manage your cookie preferences to control how your data is used.
                                        </p>
                                    </div>

                                    <div className="space-y-6">
                                        {/* Necessary Cookies */}
                                        <div className="flex items-center justify-between p-6 bg-green-50 rounded-2xl border border-green-200">
                                            <div className="flex items-center space-x-4">
                                                <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                                                    <FaLock className="text-xl text-white" />
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold text-gray-800">Necessary Cookies</h3>
                                                    <p className="text-sm text-gray-600">Required for basic functionality</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <FaCheck className="text-green-500 text-xl" />
                                                <span className="text-green-600 font-medium">Always Active</span>
                                            </div>
                                        </div>

                                        {/* Analytics Cookies */}
                                        <div className="flex items-center justify-between p-6 bg-amber-50 rounded-2xl border border-amber-200">
                                            <div className="flex items-center space-x-4">
                                                <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center">
                                                    <FaChartBar className="text-xl text-white" />
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold text-gray-800">Analytics Cookies</h3>
                                                    <p className="text-sm text-gray-600">Help us improve our service</p>
                                                </div>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={consent.analytics}
                                                    onChange={(e) => handleConsentChange('analytics', e.target.checked)}
                                                    className="sr-only peer"
                                                />
                                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
                                            </label>
                                        </div>

                                        {/* Marketing Cookies */}
                                        <div className="flex items-center justify-between p-6 bg-orange-50 rounded-2xl border border-orange-200">
                                            <div className="flex items-center space-x-4">
                                                <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center">
                                                    <FaBell className="text-xl text-white" />
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold text-gray-800">Marketing Cookies</h3>
                                                    <p className="text-sm text-gray-600">Used for personalized content</p>
                                                </div>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={consent.marketing}
                                                    onChange={(e) => handleConsentChange('marketing', e.target.checked)}
                                                    className="sr-only peer"
                                                />
                                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'privacy' && (
                                <div className="space-y-8">
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-800 mb-4">Privacy Mode</h2>
                                        <p className="text-gray-600 mb-6">
                                            Enable privacy mode to limit tracking and data collection.
                                        </p>
                                    </div>

                                    <div className="space-y-6">
                                        {/* Privacy Mode Toggle */}
                                        <div className="flex items-center justify-between p-6 bg-purple-50 rounded-2xl border border-purple-200">
                                            <div className="flex items-center space-x-4">
                                                <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
                                                    <FaUserSecret className="text-xl text-white" />
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold text-gray-800">Privacy Mode</h3>
                                                    <p className="text-sm text-gray-600">
                                                        {privacyMode
                                                            ? 'Currently active - tracking is limited'
                                                            : 'Currently inactive - full tracking enabled'
                                                        }
                                                    </p>
                                                </div>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={privacyMode}
                                                    onChange={handlePrivacyModeToggle}
                                                    className="sr-only peer"
                                                />
                                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                                            </label>
                                        </div>

                                        {/* Do Not Track Status */}
                                        <div className="flex items-center justify-between p-6 bg-blue-50 rounded-2xl border border-blue-200">
                                            <div className="flex items-center space-x-4">
                                                <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                                                    <FaEyeSlash className="text-xl text-white" />
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold text-gray-800">Do Not Track</h3>
                                                    <p className="text-sm text-gray-600">
                                                        {PrivacyControls.doNotTrack()
                                                            ? 'Your browser has Do Not Track enabled'
                                                            : 'Your browser does not have Do Not Track enabled'
                                                        }
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                {PrivacyControls.doNotTrack() ? (
                                                    <>
                                                        <FaCheck className="text-blue-500 text-xl" />
                                                        <span className="text-blue-600 font-medium">Respected</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <FaTimes className="text-gray-400 text-xl" />
                                                        <span className="text-gray-500 font-medium">Not Set</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'data' && (
                                <div className="space-y-8">
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-800 mb-4">Data Management</h2>
                                        <p className="text-gray-600 mb-6">
                                            Export your data or request complete deletion (right to be forgotten).
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Export Data */}
                                        <div className="p-6 bg-green-50 rounded-2xl border border-green-200">
                                            <div className="flex items-center space-x-4 mb-4">
                                                <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                                                    <FaDownload className="text-xl text-white" />
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold text-gray-800">Export My Data</h3>
                                                    <p className="text-sm text-gray-600">Download all your data</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => setShowExportConfirm(true)}
                                                className="w-full py-3 bg-green-600 text-white font-medium rounded-xl hover:bg-green-700 transition-colors duration-300"
                                            >
                                                Export Data
                                            </button>
                                        </div>

                                        {/* Delete Data */}
                                        <div className="p-6 bg-red-50 rounded-2xl border border-red-200">
                                            <div className="flex items-center space-x-4 mb-4">
                                                <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center">
                                                    <FaTrash className="text-xl text-white" />
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold text-gray-800">Delete My Data</h3>
                                                    <p className="text-sm text-gray-600">Permanently remove all data</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => setShowDeleteConfirm(true)}
                                                className="w-full py-3 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 transition-colors duration-300"
                                            >
                                                Delete Data
                                            </button>
                                        </div>
                                    </div>

                                    {/* Warning */}
                                    <div className="p-4 bg-yellow-50 rounded-2xl border border-yellow-200">
                                        <div className="flex items-start space-x-3">
                                            <FaExclamationTriangle className="text-yellow-600 text-xl mt-1" />
                                            <div>
                                                <h4 className="font-semibold text-yellow-800">Important Notice</h4>
                                                <p className="text-sm text-yellow-700">
                                                    Data deletion is permanent and cannot be undone. This will remove all your account data,
                                                    including profile information, activity history, and preferences.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'analytics' && (
                                <div className="space-y-8">
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-800 mb-4">Analytics & Tracking</h2>
                                        <p className="text-gray-600 mb-6">
                                            View and manage your analytics data and tracking preferences.
                                        </p>
                                    </div>

                                    <div className="space-y-6">
                                        {/* Analytics Status */}
                                        <div className="p-6 bg-blue-50 rounded-2xl border border-blue-200">
                                            <div className="flex items-center justify-between mb-4">
                                                <h3 className="font-semibold text-gray-800">Analytics Status</h3>
                                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${consent.analytics
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-gray-100 text-gray-800'
                                                    }`}>
                                                    {consent.analytics ? 'Enabled' : 'Disabled'}
                                                </span>
                                            </div>

                                            {consent.analytics ? (
                                                <div className="space-y-3">
                                                    <p className="text-sm text-gray-600">
                                                        Analytics tracking is currently enabled. We collect anonymous usage data to improve our service.
                                                    </p>
                                                    <button
                                                        onClick={() => handleConsentChange('analytics', false)}
                                                        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                                                    >
                                                        Disable Analytics
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="space-y-3">
                                                    <p className="text-sm text-gray-600">
                                                        Analytics tracking is currently disabled. No usage data is being collected.
                                                    </p>
                                                    <button
                                                        onClick={() => handleConsentChange('analytics', true)}
                                                        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                                                    >
                                                        Enable Analytics
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        {/* Data Collection Info */}
                                        <div className="p-6 bg-gray-50 rounded-2xl border border-gray-200">
                                            <h3 className="font-semibold text-gray-800 mb-4">What We Collect</h3>
                                            <div className="space-y-3 text-sm text-gray-600">
                                                <div className="flex items-center space-x-2">
                                                    <FaInfoCircle className="text-gray-400" />
                                                    <span>Page views and navigation patterns</span>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <FaInfoCircle className="text-gray-400" />
                                                    <span>Device type and browser information</span>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <FaInfoCircle className="text-gray-400" />
                                                    <span>Time spent on pages</span>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <FaInfoCircle className="text-gray-400" />
                                                    <span>Error reports and performance data</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Confirmation Modals */}
                {showExportConfirm && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-3xl p-8 max-w-md w-full">
                            <div className="text-center">
                                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <FaDownload className="text-2xl text-white" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-800 mb-2">Export Your Data</h3>
                                <p className="text-gray-600 mb-6">
                                    This will download all your data in JSON format. The file will contain your profile information,
                                    activity history, and preferences.
                                </p>
                                <div className="flex space-x-4">
                                    <button
                                        onClick={() => setShowExportConfirm(false)}
                                        className="flex-1 py-3 px-6 bg-gray-200 text-gray-800 font-medium rounded-xl hover:bg-gray-300 transition-colors duration-300"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleExportData}
                                        className="flex-1 py-3 px-6 bg-green-600 text-white font-medium rounded-xl hover:bg-green-700 transition-colors duration-300"
                                    >
                                        Export
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {showDeleteConfirm && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-3xl p-8 max-w-md w-full">
                            <div className="text-center">
                                <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <FaTrash className="text-2xl text-white" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-800 mb-2">Delete Your Data</h3>
                                <p className="text-gray-600 mb-6">
                                    This action is permanent and cannot be undone. All your data will be permanently deleted
                                    and you will be logged out.
                                </p>
                                <div className="flex space-x-4">
                                    <button
                                        onClick={() => setShowDeleteConfirm(false)}
                                        className="flex-1 py-3 px-6 bg-gray-200 text-gray-800 font-medium rounded-xl hover:bg-gray-300 transition-colors duration-300"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleDeleteData}
                                        className="flex-1 py-3 px-6 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 transition-colors duration-300"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PrivacySettings; 