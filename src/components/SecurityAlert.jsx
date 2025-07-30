import React, { useEffect, useState } from 'react';
import {
    FaBell,
    FaBug,
    FaCheckCircle,
    FaClock,
    FaExclamationTriangle,
    FaHistory,
    FaInfoCircle,
    FaShieldAlt,
    FaTrash,
    FaUserSecret
} from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { ActivityLogger, getSecureSession } from '../utils/security';

const SecurityAlert = () => {
    const { user } = useAuth();
    const [alerts, setAlerts] = useState([]);
    const [activeTab, setActiveTab] = useState('active');
    const [showResolved, setShowResolved] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [alertStats, setAlertStats] = useState({
        total: 0,
        active: 0,
        resolved: 0,
        critical: 0,
        high: 0,
        medium: 0,
        low: 0
    });

    const session = getSecureSession();

    useEffect(() => {
        loadSecurityAlerts();
        const interval = setInterval(loadSecurityAlerts, 30000); // Refresh every 30 seconds
        return () => clearInterval(interval);
    }, []);

    const loadSecurityAlerts = () => {
        setIsLoading(true);

        try {
            // Get activity logs to generate alerts
            const activityLogs = ActivityLogger.getActivityLogs ? ActivityLogger.getActivityLogs() : [];

            // Generate alerts based on security events
            const generatedAlerts = generateAlertsFromLogs(activityLogs);

            // Add some sample alerts for demonstration
            const sampleAlerts = [
                {
                    id: 1,
                    type: 'critical',
                    title: 'Suspicious Login Attempt Detected',
                    description: 'Multiple failed login attempts from unknown IP address detected.',
                    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
                    status: 'active',
                    source: 'Login System',
                    details: {
                        ipAddress: '192.168.1.100',
                        location: 'Unknown',
                        attempts: 5,
                        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
                    }
                },
                {
                    id: 2,
                    type: 'high',
                    title: 'Unusual Account Activity',
                    description: 'Account accessed from a new device in an unfamiliar location.',
                    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
                    status: 'active',
                    source: 'Account Security',
                    details: {
                        location: 'New York, NY',
                        device: 'iPhone 12',
                        ipAddress: '203.0.113.1'
                    }
                },
                {
                    id: 3,
                    type: 'medium',
                    title: 'Password Change Required',
                    description: 'Your password is older than 90 days and should be updated.',
                    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
                    status: 'active',
                    source: 'Password Policy',
                    details: {
                        daysSinceChange: 95,
                        lastChanged: new Date(Date.now() - 95 * 24 * 60 * 60 * 1000)
                    }
                },
                {
                    id: 4,
                    type: 'low',
                    title: 'Security Settings Review',
                    description: 'Review your security settings to ensure optimal protection.',
                    timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
                    status: 'resolved',
                    source: 'Security Dashboard',
                    details: {
                        settingsReviewed: true,
                        recommendations: 3
                    }
                }
            ];

            const allAlerts = [...generatedAlerts, ...sampleAlerts];

            // Calculate statistics
            const stats = {
                total: allAlerts.length,
                active: allAlerts.filter(a => a.status === 'active').length,
                resolved: allAlerts.filter(a => a.status === 'resolved').length,
                critical: allAlerts.filter(a => a.type === 'critical').length,
                high: allAlerts.filter(a => a.type === 'high').length,
                medium: allAlerts.filter(a => a.type === 'medium').length,
                low: allAlerts.filter(a => a.type === 'low').length
            };

            setAlerts(allAlerts);
            setAlertStats(stats);

        } catch (error) {
            console.error('Error loading security alerts:', error);
            setAlerts([]);
        } finally {
            setIsLoading(false);
        }
    };

    const generateAlertsFromLogs = (logs) => {
        const alerts = [];

        // Check for failed login attempts
        const failedLogins = logs.filter(log =>
            log.action && log.action.includes('failed_login')
        );

        if (failedLogins.length >= 3) {
            alerts.push({
                id: Date.now() + 1,
                type: 'critical',
                title: 'Multiple Failed Login Attempts',
                description: `${failedLogins.length} failed login attempts detected.`,
                timestamp: new Date(),
                status: 'active',
                source: 'Authentication System',
                details: {
                    attempts: failedLogins.length,
                    timeSpan: '24 hours'
                }
            });
        }

        // Check for suspicious activities
        const suspiciousActivities = logs.filter(log =>
            log.action && log.action.includes('suspicious_activity')
        );

        if (suspiciousActivities.length > 0) {
            alerts.push({
                id: Date.now() + 2,
                type: 'high',
                title: 'Suspicious Activity Detected',
                description: 'Unusual account activity patterns detected.',
                timestamp: new Date(),
                status: 'active',
                source: 'Security Monitor',
                details: {
                    activities: suspiciousActivities.length,
                    types: [...new Set(suspiciousActivities.map(a => a.action))]
                }
            });
        }

        return alerts;
    };

    const resolveAlert = (alertId) => {
        setAlerts(prevAlerts =>
            prevAlerts.map(alert =>
                alert.id === alertId
                    ? { ...alert, status: 'resolved', resolvedAt: new Date() }
                    : alert
            )
        );
        loadSecurityAlerts(); // Refresh stats
    };

    const deleteAlert = (alertId) => {
        setAlerts(prevAlerts => prevAlerts.filter(alert => alert.id !== alertId));
        loadSecurityAlerts(); // Refresh stats
    };

    const getAlertIcon = (type) => {
        switch (type) {
            case 'critical':
                return <FaExclamationTriangle className="text-red-500" />;
            case 'high':
                return <FaExclamationTriangle className="text-orange-500" />;
            case 'medium':
                return <FaInfoCircle className="text-yellow-500" />;
            case 'low':
                return <FaBell className="text-blue-500" />;
            default:
                return <FaBell className="text-gray-500" />;
        }
    };

    const getAlertColor = (type) => {
        switch (type) {
            case 'critical':
                return 'border-red-500 bg-red-50 dark:bg-red-900/20';
            case 'high':
                return 'border-orange-500 bg-orange-50 dark:bg-orange-900/20';
            case 'medium':
                return 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20';
            case 'low':
                return 'border-blue-500 bg-blue-50 dark:bg-blue-900/20';
            default:
                return 'border-gray-500 bg-gray-50 dark:bg-gray-900/20';
        }
    };

    const getStatusColor = (status) => {
        return status === 'active'
            ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
            : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    };

    const formatTimestamp = (timestamp) => {
        const now = new Date();
        const diff = now - new Date(timestamp);
        const minutes = Math.floor(diff / (1000 * 60));
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (minutes < 60) return `${minutes} minutes ago`;
        if (hours < 24) return `${hours} hours ago`;
        return `${days} days ago`;
    };

    const filteredAlerts = alerts.filter(alert => {
        if (activeTab === 'active') return alert.status === 'active';
        if (activeTab === 'resolved') return alert.status === 'resolved';
        return true;
    });

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-red-600 via-red-700 to-red-800 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-white text-xl font-semibold">Loading security alerts...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
                                <FaShieldAlt className="mr-3 text-red-500" />
                                Security Alerts
                            </h1>
                            <p className="mt-2 text-gray-600 dark:text-gray-400">
                                Monitor and manage security alerts for your account
                            </p>
                        </div>
                        <div className="flex space-x-3">
                            <button
                                onClick={() => loadSecurityAlerts()}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                <FaHistory className="inline mr-2" />
                                Refresh
                            </button>
                        </div>
                    </div>
                </div>

                {/* Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                                <FaExclamationTriangle className="text-red-600 dark:text-red-400" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Alerts</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{alertStats.total}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                                <FaExclamationTriangle className="text-orange-600 dark:text-orange-400" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{alertStats.active}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                                <FaCheckCircle className="text-green-600 dark:text-green-400" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Resolved</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{alertStats.resolved}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                                <FaBug className="text-red-600 dark:text-red-400" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Critical</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{alertStats.critical}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6">
                    <div className="border-b border-gray-200 dark:border-gray-700">
                        <nav className="flex space-x-8 px-6">
                            <button
                                onClick={() => setActiveTab('active')}
                                className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'active'
                                        ? 'border-red-500 text-red-600 dark:text-red-400'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                                    }`}
                            >
                                Active Alerts ({alertStats.active})
                            </button>
                            <button
                                onClick={() => setActiveTab('resolved')}
                                className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'resolved'
                                        ? 'border-red-500 text-red-600 dark:text-red-400'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                                    }`}
                            >
                                Resolved ({alertStats.resolved})
                            </button>
                        </nav>
                    </div>
                </div>

                {/* Alerts List */}
                <div className="space-y-4">
                    {filteredAlerts.length === 0 ? (
                        <div className="text-center py-12">
                            <FaShieldAlt className="mx-auto h-12 w-12 text-gray-400" />
                            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No alerts</h3>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                {activeTab === 'active' ? 'No active security alerts at this time.' : 'No resolved alerts to show.'}
                            </p>
                        </div>
                    ) : (
                        filteredAlerts.map((alert) => (
                            <div
                                key={alert.id}
                                className={`bg-white dark:bg-gray-800 rounded-lg shadow border-l-4 ${getAlertColor(alert.type)}`}
                            >
                                <div className="p-6">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start space-x-4">
                                            <div className="flex-shrink-0">
                                                {getAlertIcon(alert.type)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center space-x-2 mb-2">
                                                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                                                        {alert.title}
                                                    </h3>
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(alert.status)}`}>
                                                        {alert.status}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                                    {alert.description}
                                                </p>
                                                <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                                                    <span className="flex items-center">
                                                        <FaClock className="mr-1" />
                                                        {formatTimestamp(alert.timestamp)}
                                                    </span>
                                                    <span className="flex items-center">
                                                        <FaUserSecret className="mr-1" />
                                                        {alert.source}
                                                    </span>
                                                </div>
                                                {alert.details && (
                                                    <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                                                        <details className="text-sm">
                                                            <summary className="cursor-pointer font-medium text-gray-700 dark:text-gray-300">
                                                                View Details
                                                            </summary>
                                                            <pre className="mt-2 text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                                                                {JSON.stringify(alert.details, null, 2)}
                                                            </pre>
                                                        </details>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            {alert.status === 'active' && (
                                                <button
                                                    onClick={() => resolveAlert(alert.id)}
                                                    className="p-2 text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
                                                    title="Mark as resolved"
                                                >
                                                    <FaCheckCircle />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => deleteAlert(alert.id)}
                                                className="p-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                                                title="Delete alert"
                                            >
                                                <FaTrash />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default SecurityAlert; 