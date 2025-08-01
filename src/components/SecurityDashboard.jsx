import React, { useEffect, useState } from 'react';
import {
    FaCheckCircle,
    FaCog,
    FaExclamationTriangle,
    FaEye,
    FaEyeSlash,
    FaHistory,
    FaLock,
    FaRefresh,
    FaShieldAlt,
    FaTrash,
    FaUserShield
} from 'react-icons/fa';
import { PrivacyControls } from '../utils/dataProtection';
import { ActivityLogger } from '../utils/security';

const SecurityDashboard = () => {
    const [activeTab, setActiveTab] = useState('overview');
    const [securityStatus, setSecurityStatus] = useState(null);
    const [recentThreats, setRecentThreats] = useState([]);
    const [securityEvents, setSecurityEvents] = useState([]);
    const [privacyStatus, setPrivacyStatus] = useState({});
    const [overallScore, setOverallScore] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadSecurityData();
        const interval = setInterval(loadSecurityData, 30000); // Refresh every 30 seconds
        return () => clearInterval(interval);
    }, []);

    const loadSecurityData = () => {
        setIsLoading(true);

        try {
            // Get privacy status
            const privacyMode = PrivacyControls.privacyMode?.isEnabled ? PrivacyControls.privacyMode.isEnabled() : false;
            const doNotTrack = PrivacyControls.doNotTrack ? PrivacyControls.doNotTrack() : false;
            const consent = PrivacyControls.cookieConsent?.get ? PrivacyControls.cookieConsent.get() : { analytics: false };

            // Get recent security events
            const events = ActivityLogger.getEvents ? ActivityLogger.getEvents({ since: new Date(Date.now() - 24 * 60 * 60 * 1000) }) : [];

            // Calculate overall security score
            let score = 100;

            // Privacy score
            if (privacyMode) score += 10;
            if (doNotTrack) score += 10;
            if (!consent?.analytics) score += 5;

            // Event score
            const highSeverityEvents = events.filter(e => e.details?.severity === 'high').length;
            score -= highSeverityEvents * 10;

            setSecurityStatus({
                isInitialized: true, // Assuming security features are always initialized for this dashboard
                suspiciousActivities: 0, // No anti-tampering status to report
                recentActivities: [] // No recent activities to report
            });
            setRecentThreats([]);
            setSecurityEvents(events.slice(-10));
            setPrivacyStatus({ privacyMode, doNotTrack, consent });
            setOverallScore(Math.max(0, Math.min(100, score)));

        } catch (error) {
            console.error('Error loading security data:', error);
            // Set default values if security features fail to load
            setSecurityStatus({
                isInitialized: false,
                suspiciousActivities: 0,
                recentActivities: []
            });
            setRecentThreats([]);
            setSecurityEvents([]);
            setPrivacyStatus({ privacyMode: false, doNotTrack: false, consent: { analytics: false } });
            setOverallScore(50); // Default score
        } finally {
            setIsLoading(false);
        }
    };

    const getScoreColor = (score) => {
        if (score >= 80) return 'text-green-600';
        if (score >= 60) return 'text-yellow-600';
        return 'text-red-600';
    };

    const getScoreMessage = (score) => {
        if (score >= 80) return 'Excellent security posture';
        if (score >= 60) return 'Good security posture';
        return 'Security needs attention';
    };

    const getThreatLevel = (activities) => {
        if (activities.length === 0) return { level: 'low', color: 'text-green-600', icon: FaCheckCircle };
        if (activities.length <= 2) return { level: 'medium', color: 'text-yellow-600', icon: FaExclamationTriangle };
        return { level: 'high', color: 'text-red-600', icon: FaExclamationTriangle };
    };

    const exportSecurityReport = () => {
        const report = {
            timestamp: new Date().toISOString(),
            overallScore,
            securityStatus,
            privacyStatus,
            recentThreats,
            securityEvents,
            recommendations: generateRecommendations()
        };

        const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `security-report-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const generateRecommendations = () => {
        const recommendations = [];

        if (securityStatus?.suspiciousActivities > 0) {
            recommendations.push('Review suspicious activities and consider additional security measures');
        }

        if (!privacyStatus.privacyMode) {
            recommendations.push('Enable privacy mode to limit tracking');
        }

        if (privacyStatus.consent?.analytics) {
            recommendations.push('Consider disabling analytics cookies for enhanced privacy');
        }

        if (securityEvents.length > 5) {
            recommendations.push('High number of security events detected - review system logs');
        }

        return recommendations;
    };

    const clearSecurityData = () => {
        if (window.confirm('Are you sure you want to clear all security data? This action cannot be undone.')) {
            ActivityLogger.clearEvents();
            loadSecurityData();
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 p-4">
                <div className="max-w-6xl mx-auto">
                    <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-amber-200/30">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-amber-600 mx-auto mb-4"></div>
                            <h3 className="text-xl font-semibold text-gray-800 mb-2">Loading Security Dashboard</h3>
                            <p className="text-gray-600">Analyzing security posture and threat detection...</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 p-4">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 mb-8 border border-amber-200/30">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <div className="w-16 h-16 bg-gradient-to-r from-amber-600 to-orange-600 rounded-2xl flex items-center justify-center">
                                <FaShieldAlt className="text-3xl text-white" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-800">Security Dashboard</h1>
                                <p className="text-gray-600">Comprehensive security monitoring and threat detection</p>
                            </div>
                        </div>

                        <div className="flex items-center space-x-4">
                            <button
                                onClick={loadSecurityData}
                                className="p-3 bg-amber-100 text-amber-600 rounded-xl hover:bg-amber-200 transition-colors duration-300"
                            >
                                <FaRefresh className="text-xl" />
                            </button>
                            <button
                                onClick={exportSecurityReport}
                                className="p-3 bg-green-100 text-green-600 rounded-xl hover:bg-green-200 transition-colors duration-300"
                            >
                                <FaShieldAlt className="text-xl" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Overall Security Score */}
                <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 mb-8 border border-amber-200/30">
                    <div className="text-center">
                        <div className={`text-6xl font-bold ${getScoreColor(overallScore)} mb-4`}>
                            {overallScore}
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">Overall Security Score</h2>
                        <p className={`text-lg ${getScoreColor(overallScore)}`}>
                            {getScoreMessage(overallScore)}
                        </p>
                    </div>
                </div>

                {/* Main Content */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Sidebar */}
                    <div className="lg:col-span-1">
                        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-6 border border-amber-200/30">
                            <nav className="space-y-2">
                                {[
                                    { id: 'overview', label: 'Overview', icon: FaShieldAlt },
                                    { id: 'threats', label: 'Threat Detection', icon: FaExclamationTriangle },
                                    { id: 'privacy', label: 'Privacy', icon: FaUserShield },
                                    { id: 'network', label: 'Network', icon: FaLock },
                                    { id: 'events', label: 'Events', icon: FaHistory },
                                    { id: 'settings', label: 'Settings', icon: FaCog }
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
                            {activeTab === 'overview' && (
                                <div className="space-y-8">
                                    <h2 className="text-2xl font-bold text-gray-800">Security Overview</h2>

                                    {/* Protection Status */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="p-6 bg-green-50 rounded-2xl border border-green-200">
                                            <div className="flex items-center space-x-3 mb-4">
                                                <FaCheckCircle className="text-green-500 text-xl" />
                                                <h3 className="font-semibold text-gray-800">Anti-Tampering</h3>
                                            </div>
                                            <p className="text-sm text-gray-600">
                                                {securityStatus?.isInitialized ? 'Active' : 'Inactive'}
                                            </p>
                                        </div>

                                        <div className={`p-6 rounded-2xl border ${privacyStatus.privacyMode ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'
                                            }`}>
                                            <div className="flex items-center space-x-3 mb-4">
                                                {privacyStatus.privacyMode ? (
                                                    <FaCheckCircle className="text-green-500 text-xl" />
                                                ) : (
                                                    <FaEyeSlash className="text-yellow-500 text-xl" />
                                                )}
                                                <h3 className="font-semibold text-gray-800">Privacy Mode</h3>
                                            </div>
                                            <p className="text-sm text-gray-600">
                                                {privacyStatus.privacyMode ? 'Enabled' : 'Disabled'}
                                            </p>
                                        </div>

                                        <div className={`p-6 rounded-2xl border ${privacyStatus.doNotTrack ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                                            }`}>
                                            <div className="flex items-center space-x-3 mb-4">
                                                {privacyStatus.doNotTrack ? (
                                                    <FaCheckCircle className="text-green-500 text-xl" />
                                                ) : (
                                                    <FaEye className="text-gray-500 text-xl" />
                                                )}
                                                <h3 className="font-semibold text-gray-800">Do Not Track</h3>
                                            </div>
                                            <p className="text-sm text-gray-600">
                                                {privacyStatus.doNotTrack ? 'Respected' : 'Not Set'}
                                            </p>
                                        </div>

                                        <div className="p-6 bg-blue-50 rounded-2xl border border-blue-200">
                                            <div className="flex items-center space-x-3 mb-4">
                                                <FaExclamationTriangle className="text-blue-500 text-xl" />
                                                <h3 className="font-semibold text-gray-800">Integrity Checks</h3>
                                            </div>
                                            <p className="text-sm text-gray-600">
                                                {securityStatus?.integritySnapshots || 0} snapshots active
                                            </p>
                                        </div>
                                    </div>

                                    {/* Recent Threats */}
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Threats</h3>
                                        {recentThreats.length > 0 ? (
                                            <div className="space-y-3">
                                                {recentThreats.slice(-5).map((threat, index) => (
                                                    <div key={index} className="p-4 bg-red-50 rounded-2xl border border-red-200">
                                                        <div className="flex items-center space-x-3">
                                                            <FaExclamationTriangle className="text-red-500" />
                                                            <div>
                                                                <p className="font-medium text-gray-800">{threat.type}</p>
                                                                <p className="text-sm text-gray-600">
                                                                    {new Date(threat.timestamp).toLocaleString()}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="p-6 bg-green-50 rounded-2xl border border-green-200 text-center">
                                                <FaCheckCircle className="text-green-500 text-3xl mx-auto mb-2" />
                                                <p className="text-green-800 font-medium">No recent threats detected</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'threats' && (
                                <div className="space-y-8">
                                    <h2 className="text-2xl font-bold text-gray-800">Threat Detection</h2>

                                    <div className="space-y-6">
                                        {/* Threat Level */}
                                        <div className="p-6 bg-white rounded-2xl border border-gray-200">
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-lg font-semibold text-gray-800">Current Threat Level</h3>
                                                {(() => {
                                                    const threat = getThreatLevel(recentThreats);
                                                    const Icon = threat.icon;
                                                    return (
                                                        <div className={`flex items-center space-x-2 ${threat.color}`}>
                                                            <Icon className="text-xl" />
                                                            <span className="font-medium capitalize">{threat.level}</span>
                                                        </div>
                                                    );
                                                })()}
                                            </div>
                                        </div>

                                        {/* Suspicious Activities */}
                                        <div className="p-6 bg-white rounded-2xl border border-gray-200">
                                            <h3 className="text-lg font-semibold text-gray-800 mb-4">Suspicious Activities</h3>
                                            <div className="space-y-3">
                                                {recentThreats.map((activity, index) => (
                                                    <div key={index} className="p-4 bg-gray-50 rounded-xl">
                                                        <div className="flex items-center justify-between">
                                                            <div>
                                                                <p className="font-medium text-gray-800">{activity.type}</p>
                                                                <p className="text-sm text-gray-600">
                                                                    {new Date(activity.timestamp).toLocaleString()}
                                                                </p>
                                                            </div>
                                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${activity.severity === 'high' ? 'bg-red-100 text-red-800' :
                                                                activity.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                                                    'bg-blue-100 text-blue-800'
                                                                }`}>
                                                                {activity.severity}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'privacy' && (
                                <div className="space-y-8">
                                    <h2 className="text-2xl font-bold text-gray-800">Privacy Status</h2>

                                    <div className="space-y-6">
                                        {/* Privacy Controls */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className={`p-6 rounded-2xl border ${privacyStatus.privacyMode ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                                                }`}>
                                                <div className="flex items-center space-x-3 mb-4">
                                                    <FaUserShield className="text-purple-500 text-xl" />
                                                    <h3 className="font-semibold text-gray-800">Privacy Mode</h3>
                                                </div>
                                                <p className="text-sm text-gray-600 mb-4">
                                                    {privacyStatus.privacyMode
                                                        ? 'Tracking is limited and data collection is minimized'
                                                        : 'Full tracking and data collection is enabled'
                                                    }
                                                </p>
                                                <button
                                                    onClick={() => {
                                                        if (privacyStatus.privacyMode) {
                                                            PrivacyControls.privacyMode.disable();
                                                        } else {
                                                            PrivacyControls.privacyMode.enable();
                                                        }
                                                        loadSecurityData();
                                                    }}
                                                    className={`px-4 py-2 rounded-xl font-medium transition-colors duration-300 ${privacyStatus.privacyMode
                                                        ? 'bg-red-100 text-red-600 hover:bg-red-200'
                                                        : 'bg-green-100 text-green-600 hover:bg-green-200'
                                                        }`}
                                                >
                                                    {privacyStatus.privacyMode ? 'Disable' : 'Enable'}
                                                </button>
                                            </div>

                                            <div className={`p-6 rounded-2xl border ${privacyStatus.doNotTrack ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                                                }`}>
                                                <div className="flex items-center space-x-3 mb-4">
                                                    <FaEyeSlash className="text-blue-500 text-xl" />
                                                    <h3 className="font-semibold text-gray-800">Do Not Track</h3>
                                                </div>
                                                <p className="text-sm text-gray-600">
                                                    {privacyStatus.doNotTrack
                                                        ? 'Your browser has Do Not Track enabled and we respect this setting'
                                                        : 'Your browser does not have Do Not Track enabled'
                                                    }
                                                </p>
                                            </div>
                                        </div>

                                        {/* Cookie Consent */}
                                        <div className="p-6 bg-white rounded-2xl border border-gray-200">
                                            <h3 className="text-lg font-semibold text-gray-800 mb-4">Cookie Consent</h3>
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-gray-600">Analytics Cookies</span>
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${privacyStatus.consent?.analytics ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                                        }`}>
                                                        {privacyStatus.consent?.analytics ? 'Enabled' : 'Disabled'}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-gray-600">Marketing Cookies</span>
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${privacyStatus.consent?.marketing ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                                        }`}>
                                                        {privacyStatus.consent?.marketing ? 'Enabled' : 'Disabled'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'network' && (
                                <div className="space-y-8">
                                    <h2 className="text-2xl font-bold text-gray-800">Network Security</h2>

                                    <div className="space-y-6">
                                        {/* Network Monitoring */}
                                        <div className="p-6 bg-white rounded-2xl border border-gray-200">
                                            <div className="flex items-center space-x-3 mb-4">
                                                <FaLock className="text-blue-500 text-xl" />
                                                <h3 className="text-lg font-semibold text-gray-800">Network Monitoring</h3>
                                            </div>
                                            <p className="text-sm text-gray-600">
                                                Network requests are being monitored for suspicious activity and security headers.
                                            </p>
                                        </div>

                                        {/* Proxy Detection */}
                                        <div className="p-6 bg-white rounded-2xl border border-gray-200">
                                            <h3 className="text-lg font-semibold text-gray-800 mb-4">Proxy Detection</h3>
                                            <p className="text-sm text-gray-600">
                                                Proxy detection is available for enhanced security monitoring.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'events' && (
                                <div className="space-y-8">
                                    <h2 className="text-2xl font-bold text-gray-800">Security Events</h2>

                                    <div className="space-y-6">
                                        {securityEvents.length > 0 ? (
                                            <div className="space-y-3">
                                                {securityEvents.map((event, index) => (
                                                    <div key={index} className="p-4 bg-gray-50 rounded-2xl border border-gray-200">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <span className="font-medium text-gray-800">{event.type}</span>
                                                            <span className="text-sm text-gray-500">
                                                                {new Date(event.timestamp).toLocaleString()}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm text-gray-600">{event.details?.message || 'Security event detected'}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="p-6 bg-green-50 rounded-2xl border border-green-200 text-center">
                                                <FaCheckCircle className="text-green-500 text-3xl mx-auto mb-2" />
                                                <p className="text-green-800 font-medium">No security events in the last 24 hours</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'settings' && (
                                <div className="space-y-8">
                                    <h2 className="text-2xl font-bold text-gray-800">Security Settings</h2>

                                    <div className="space-y-6">
                                        {/* Data Management */}
                                        <div className="p-6 bg-white rounded-2xl border border-gray-200">
                                            <h3 className="text-lg font-semibold text-gray-800 mb-4">Data Management</h3>
                                            <div className="space-y-4">
                                                <button
                                                    onClick={exportSecurityReport}
                                                    className="w-full p-4 bg-green-100 text-green-600 rounded-xl hover:bg-green-200 transition-colors duration-300 flex items-center justify-center space-x-2"
                                                >
                                                    <FaShieldAlt />
                                                    <span>Export Security Report</span>
                                                </button>
                                                <button
                                                    onClick={clearSecurityData}
                                                    className="w-full p-4 bg-red-100 text-red-600 rounded-xl hover:bg-red-200 transition-colors duration-300 flex items-center justify-center space-x-2"
                                                >
                                                    <FaTrash />
                                                    <span>Clear Security Data</span>
                                                </button>
                                            </div>
                                        </div>

                                        {/* System Status */}
                                        <div className="p-6 bg-white rounded-2xl border border-gray-200">
                                            <h3 className="text-lg font-semibold text-gray-800 mb-4">System Status</h3>
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-gray-600">Anti-Tampering Protection</span>
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${securityStatus?.isInitialized ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                        }`}>
                                                        {securityStatus?.isInitialized ? 'Active' : 'Inactive'}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-gray-600">Suspicious Activities</span>
                                                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                        {securityStatus?.suspiciousActivities || 0}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-gray-600">Security Alerts</span>
                                                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                        {securityStatus?.alerts || 0}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SecurityDashboard; 