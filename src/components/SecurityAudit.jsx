import React, { useState, useEffect } from 'react';
import { 
  FaShieldAlt, 
  FaEye, 
  FaEyeSlash, 
  FaLock, 
  FaUser, 
  FaHistory, 
  FaExclamationTriangle, 
  FaCheckCircle, 
  FaClock,
  FaMapMarkerAlt,
  FaDesktop,
  FaMobile,
  FaTablet,
  FaTrash,
  FaDownload
} from 'react-icons/fa';
import { ActivityLogger, getSecureSession, clearSecureSession } from '../utils/security';

const SecurityAudit = () => {
  const [showSensitiveData, setShowSensitiveData] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [activityLogs, setActivityLogs] = useState([]);
  const [securityScore, setSecurityScore] = useState(0);
  const [recommendations, setRecommendations] = useState([]);

  const session = getSecureSession();

  useEffect(() => {
    loadActivityLogs();
    calculateSecurityScore();
    generateRecommendations();
  }, []);

  const loadActivityLogs = () => {
    const logs = ActivityLogger.getActivityLogs();
    setActivityLogs(logs.slice(-50)); // Show last 50 activities
  };

  const calculateSecurityScore = () => {
    let score = 100;
    const issues = [];

    // Check if MFA is enabled
    if (!session?.mfaEnabled) {
      score -= 20;
      issues.push('Multi-factor authentication not enabled');
    }

    // Check password age
    if (session?.passwordLastChanged) {
      const daysSinceChange = Math.floor((Date.now() - new Date(session.passwordLastChanged)) / (1000 * 60 * 60 * 24));
      if (daysSinceChange > 90) {
        score -= 15;
        issues.push('Password is older than 90 days');
      }
    }

    // Check for suspicious activities
    const suspiciousActivities = activityLogs.filter(log => 
      log.action.includes('failed_login') || 
      log.action.includes('suspicious_activity')
    );
    if (suspiciousActivities.length > 0) {
      score -= 10;
      issues.push('Suspicious activities detected');
    }

    // Check for multiple devices
    const uniqueDevices = new Set(activityLogs.map(log => log.userAgent)).size;
    if (uniqueDevices > 5) {
      score -= 5;
      issues.push('Multiple devices detected');
    }

    setSecurityScore(Math.max(0, score));
  };

  const generateRecommendations = () => {
    const recs = [];

    if (!session?.mfaEnabled) {
      recs.push({
        priority: 'high',
        title: 'Enable Multi-Factor Authentication',
        description: 'Add an extra layer of security to your account',
        action: 'Enable MFA'
      });
    }

    if (session?.passwordLastChanged) {
      const daysSinceChange = Math.floor((Date.now() - new Date(session.passwordLastChanged)) / (1000 * 60 * 60 * 24));
      if (daysSinceChange > 90) {
        recs.push({
          priority: 'medium',
          title: 'Update Your Password',
          description: 'Your password is older than 90 days',
          action: 'Change Password'
        });
      }
    }

    const failedLogins = activityLogs.filter(log => log.action.includes('failed_login'));
    if (failedLogins.length > 0) {
      recs.push({
        priority: 'high',
        title: 'Review Failed Login Attempts',
        description: `${failedLogins.length} failed login attempts detected`,
        action: 'Review Activity'
      });
    }

    recs.push({
      priority: 'low',
      title: 'Review Account Activity',
      description: 'Regularly check your account activity for suspicious behavior',
      action: 'View Activity'
    });

    setRecommendations(recs);
  };

  const getDeviceType = (userAgent) => {
    if (/Mobile|Android|iPhone|iPad/.test(userAgent)) {
      return /iPad/.test(userAgent) ? 'tablet' : 'mobile';
    }
    return 'desktop';
  };

  const getDeviceIcon = (deviceType) => {
    switch (deviceType) {
      case 'mobile':
        return <FaMobile className="text-blue-500" />;
      case 'tablet':
        return <FaTablet className="text-green-500" />;
      default:
        return <FaDesktop className="text-purple-500" />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-100';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100';
      case 'low':
        return 'text-blue-600 bg-blue-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const exportActivityLogs = () => {
    const dataStr = JSON.stringify(activityLogs, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `activity-logs-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const clearActivityLogs = () => {
    if (window.confirm('Are you sure you want to clear all activity logs? This action cannot be undone.')) {
      ActivityLogger.clearActivityLogs();
      setActivityLogs([]);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600 to-orange-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FaShieldAlt className="text-3xl" />
              <div>
                <h1 className="text-2xl font-bold">Security Center</h1>
                <p className="text-amber-100">Monitor and manage your account security</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">{securityScore}%</div>
              <div className="text-amber-100">Security Score</div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'overview', label: 'Overview', icon: FaShieldAlt },
              { id: 'activity', label: 'Activity Log', icon: FaHistory },
              { id: 'devices', label: 'Devices', icon: FaDesktop },
              { id: 'recommendations', label: 'Recommendations', icon: FaExclamationTriangle }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-amber-500 text-amber-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <tab.icon className="text-lg" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Security Status */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                  <div className="flex items-center space-x-3">
                    <FaCheckCircle className="text-2xl text-green-500" />
                    <div>
                      <h3 className="font-semibold text-green-800">Account Status</h3>
                      <p className="text-green-600">Active and Secure</p>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                  <div className="flex items-center space-x-3">
                    <FaLock className="text-2xl text-blue-500" />
                    <div>
                      <h3 className="font-semibold text-blue-800">Last Login</h3>
                      <p className="text-blue-600">
                        {session?.lastActivity 
                          ? new Date(session.lastActivity).toLocaleDateString()
                          : 'Unknown'
                        }
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-purple-50 border border-purple-200 rounded-xl p-6">
                  <div className="flex items-center space-x-3">
                    <FaUser className="text-2xl text-purple-500" />
                    <div>
                      <h3 className="font-semibold text-purple-800">Session ID</h3>
                      <p className="text-purple-600 font-mono text-sm">
                        {showSensitiveData 
                          ? session?.sessionId?.slice(0, 8) + '...'
                          : '••••••••'
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <button className="p-4 bg-white rounded-lg border border-gray-200 hover:border-amber-300 transition-colors">
                    <FaLock className="text-2xl text-amber-600 mx-auto mb-2" />
                    <span className="text-sm font-medium">Change Password</span>
                  </button>
                  <button className="p-4 bg-white rounded-lg border border-gray-200 hover:border-amber-300 transition-colors">
                    <FaShieldAlt className="text-2xl text-amber-600 mx-auto mb-2" />
                    <span className="text-sm font-medium">Enable MFA</span>
                  </button>
                  <button className="p-4 bg-white rounded-lg border border-gray-200 hover:border-amber-300 transition-colors">
                    <FaHistory className="text-2xl text-amber-600 mx-auto mb-2" />
                    <span className="text-sm font-medium">View Activity</span>
                  </button>
                  <button className="p-4 bg-white rounded-lg border border-gray-200 hover:border-amber-300 transition-colors">
                    <FaTrash className="text-2xl text-red-600 mx-auto mb-2" />
                    <span className="text-sm font-medium">Clear Session</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-800">Recent Activity</h3>
                <div className="flex space-x-2">
                  <button
                    onClick={exportActivityLogs}
                    className="flex items-center space-x-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
                  >
                    <FaDownload className="text-sm" />
                    <span>Export</span>
                  </button>
                  <button
                    onClick={clearActivityLogs}
                    className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <FaTrash className="text-sm" />
                    <span>Clear</span>
                  </button>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 max-h-96 overflow-y-auto">
                {activityLogs.length > 0 ? (
                  <div className="space-y-3">
                    {activityLogs.map((log, index) => (
                      <div key={index} className="bg-white rounded-lg p-4 border border-gray-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            {getDeviceIcon(getDeviceType(log.userAgent))}
                            <div>
                              <p className="font-medium text-gray-800">{log.action}</p>
                              <p className="text-sm text-gray-600">
                                {new Date(log.timestamp).toLocaleString()}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-500">
                              {log.ipAddress || 'Unknown IP'}
                            </p>
                            <p className="text-xs text-gray-500">
                              {getDeviceType(log.userAgent)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FaHistory className="text-4xl text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No activity logs found</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'devices' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">Active Devices</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from(new Set(activityLogs.map(log => log.userAgent))).map((userAgent, index) => (
                  <div key={index} className="bg-white border border-gray-200 rounded-xl p-4">
                    <div className="flex items-center space-x-3">
                      {getDeviceIcon(getDeviceType(userAgent))}
                      <div className="flex-1">
                        <p className="font-medium text-gray-800">
                          {getDeviceType(userAgent).charAt(0).toUpperCase() + getDeviceType(userAgent).slice(1)}
                        </p>
                        <p className="text-sm text-gray-600 truncate">{userAgent}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'recommendations' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">Security Recommendations</h3>
              <div className="space-y-4">
                {recommendations.map((rec, index) => (
                  <div key={index} className="bg-white border border-gray-200 rounded-xl p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <FaExclamationTriangle className={`text-xl mt-1 ${getPriorityColor(rec.priority).split(' ')[0]}`} />
                        <div>
                          <h4 className="font-medium text-gray-800">{rec.title}</h4>
                          <p className="text-sm text-gray-600 mt-1">{rec.description}</p>
                        </div>
                      </div>
                      <button className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors text-sm">
                        {rec.action}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SecurityAudit; 