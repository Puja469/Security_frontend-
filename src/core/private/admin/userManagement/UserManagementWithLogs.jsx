import React, { useState, useEffect } from 'react';
import {
  FaUsers, FaSearch, FaFilter, FaEye, FaBan, FaUnlock, FaHistory,
  FaDownload, FaRefresh, FaSort, FaSortUp, FaSortDown, FaUser,
  FaEnvelope, FaPhone, FaMapMarkerAlt, FaCalendar, FaExclamationTriangle,
  FaCheckCircle, FaTimes, FaClock, FaDesktop, FaMobile, FaTablet, FaShieldAlt
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import { publicApiClient } from '../../../../services/apiServices';

const UserManagementWithLogs = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [usersPerPage] = useState(10);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userLogs, setUserLogs] = useState([]);
  const [showUserLogs, setShowUserLogs] = useState(false);
  const [logsLoading, setLogsLoading] = useState(false);
  const [blockReason, setBlockReason] = useState('');
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [userToBlock, setUserToBlock] = useState(null);

  useEffect(() => {
    loadUsers();
  }, [currentPage, sortConfig]);

  useEffect(() => {
    applyFilters();
  }, [users, searchTerm, statusFilter, sortConfig]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        limit: usersPerPage,
        sortBy: sortConfig.key,
        sortOrder: sortConfig.direction
      };

      if (searchTerm) params.search = searchTerm;
      if (statusFilter !== 'all') params.status = statusFilter;

      const response = await publicApiClient.get('/admin/users', { params });
      
      if (response.data.status === 'success') {
        setUsers(response.data.data.users);
        setFilteredUsers(response.data.data.users);
        setTotalPages(response.data.data.pagination.totalPages);
        setTotalUsers(response.data.data.pagination.totalUsers);
      }
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...users];

    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.fname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.phone?.includes(searchTerm) ||
        user.city?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(user => {
        if (statusFilter === 'active') return !user.isBlocked && !user.isLocked;
        if (statusFilter === 'blocked') return user.isBlocked;
        if (statusFilter === 'locked') return user.isLocked;
        return true;
      });
    }

    setFilteredUsers(filtered);
  };

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return <FaSort className="text-gray-400" />;
    return sortConfig.direction === 'asc' 
      ? <FaSortUp className="text-blue-600" /> 
      : <FaSortDown className="text-blue-600" />;
  };

  const loadUserLogs = async (userId) => {
    setLogsLoading(true);
    try {
      const response = await publicApiClient.get(`/admin/users/${userId}/logs`);
      
      if (response.data.status === 'success') {
        setUserLogs(response.data.data.logs);
        setSelectedUser(users.find(user => user._id === userId));
        setShowUserLogs(true);
      }
    } catch (error) {
      console.error('Error loading user logs:', error);
      toast.error('Failed to load user logs');
    } finally {
      setLogsLoading(false);
    }
  };

  const blockUser = async (userId, reason) => {
    try {
      const response = await publicApiClient.post(`/admin/users/${userId}/block`, {
        reason
      });

      if (response.data.status === 'success') {
        toast.success('User blocked successfully');
        setShowBlockModal(false);
        setBlockReason('');
        setUserToBlock(null);
        loadUsers();
      }
    } catch (error) {
      console.error('Error blocking user:', error);
      toast.error(error.response?.data?.message || 'Failed to block user');
    }
  };

  const unblockUser = async (userId) => {
    try {
      const response = await publicApiClient.post(`/admin/users/${userId}/unblock`);

      if (response.data.status === 'success') {
        toast.success('User unblocked successfully');
        loadUsers();
      }
    } catch (error) {
      console.error('Error unblocking user:', error);
      toast.error(error.response?.data?.message || 'Failed to unblock user');
    }
  };

  const getStatusBadge = (user) => {
    if (user.isBlocked) {
      return <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">Blocked</span>;
    }
    if (user.isLocked) {
      return <span className="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded-full">Locked</span>;
    }
    return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Active</span>;
  };

  const getDeviceType = (userAgent) => {
    if (!userAgent) return 'Unknown';
    if (userAgent.includes('Mobile')) return 'Mobile';
    if (userAgent.includes('Tablet')) return 'Tablet';
    return 'Desktop';
  };

  const getDeviceIcon = (deviceType) => {
    switch (deviceType) {
      case 'Mobile': return <FaMobile className="text-blue-500" />;
      case 'Tablet': return <FaTablet className="text-green-500" />;
      case 'Desktop': return <FaDesktop className="text-purple-500" />;
      default: return <FaDesktop className="text-gray-500" />;
    }
  };

  const getActionIcon = (action) => {
    if (action.includes('login')) return <FaCheckCircle className="text-green-500" />;
    if (action.includes('failed') || action.includes('error')) return <FaExclamationTriangle className="text-red-500" />;
    if (action.includes('logout')) return <FaTimes className="text-gray-500" />;
    return <FaClock className="text-blue-500" />;
  };

  const exportUsers = () => {
    const csvContent = [
      ['Name', 'Email', 'Phone', 'City', 'Status', 'Created At', 'Block Reason'],
      ...filteredUsers.map(user => [
        user.fname || 'N/A',
        user.email || 'N/A',
        user.phone || 'N/A',
        user.city || 'N/A',
        user.isBlocked ? 'Blocked' : user.isLocked ? 'Locked' : 'Active',
        new Date(user.createdAt).toLocaleString(),
        user.blockReason || 'N/A'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setSortConfig({ key: 'createdAt', direction: 'desc' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">User Management</h1>
          <p className="text-gray-600">
            {filteredUsers.length} of {totalUsers} total users
          </p>
        </div>
        <div className="flex space-x-3 mt-4 lg:mt-0">
          <button
            onClick={loadUsers}
            className="flex items-center px-4 py-2 bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors"
          >
            <FaRefresh className="mr-2" />
            Refresh
          </button>
          <button
            onClick={exportUsers}
            className="flex items-center px-4 py-2 bg-green-100 hover:bg-green-200 rounded-lg transition-colors"
          >
            <FaDownload className="mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search Users</label>
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, phone, city..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">All Users</option>
              <option value="active">Active</option>
              <option value="blocked">Blocked</option>
              <option value="locked">Locked</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={clearFilters}
              className="flex items-center px-4 py-2 bg-red-100 hover:bg-red-200 rounded-lg transition-colors"
            >
              <FaTimes className="mr-2" />
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center">
                    <FaUser className="mr-2" />
                    User
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center">
                    <FaEnvelope className="mr-2" />
                    Contact
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center">
                    <FaMapMarkerAlt className="mr-2" />
                    Location
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('createdAt')}
                >
                  <div className="flex items-center">
                    <FaCalendar className="mr-2" />
                    Created
                    {getSortIcon('createdAt')}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center">
                    <FaShieldAlt className="mr-2" />
                    Status
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                          <FaUser className="text-purple-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{user.fname}</div>
                        <div className="text-sm text-gray-500">ID: {user._id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{user.email}</div>
                    <div className="text-sm text-gray-500">{user.phone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.city || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(user)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => loadUserLogs(user._id)}
                        className="text-blue-600 hover:text-blue-900"
                        title="View Logs"
                      >
                        <FaHistory className="text-lg" />
                      </button>
                      {user.isBlocked ? (
                        <button
                          onClick={() => unblockUser(user._id)}
                          className="text-green-600 hover:text-green-900"
                          title="Unblock User"
                        >
                          <FaUnlock className="text-lg" />
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setUserToBlock(user);
                            setShowBlockModal(true);
                          }}
                          className="text-red-600 hover:text-red-900"
                          title="Block User"
                        >
                          <FaBan className="text-lg" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{(currentPage - 1) * usersPerPage + 1}</span> to{' '}
                  <span className="font-medium">
                    {Math.min(currentPage * usersPerPage, totalUsers)}
                  </span>{' '}
                  of <span className="font-medium">{totalUsers}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        currentPage === page
                          ? 'z-10 bg-purple-50 border-purple-500 text-purple-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* User Logs Modal */}
      {showUserLogs && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-6xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                User Logs - {selectedUser?.fname}
              </h3>
              <button
                onClick={() => setShowUserLogs(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FaTimes className="text-xl" />
              </button>
            </div>

            {logsLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              </div>
            ) : (
              <div className="overflow-x-auto max-h-96">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <div className="flex items-center">
                          <FaClock className="mr-2" />
                          Timestamp
                        </div>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <div className="flex items-center">
                          <FaShieldAlt className="mr-2" />
                          Action
                        </div>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <div className="flex items-center">
                          <FaMapMarkerAlt className="mr-2" />
                          IP Address
                        </div>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <div className="flex items-center">
                          <FaDesktop className="mr-2" />
                          Device
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {userLogs.map((log, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {getActionIcon(log.action)}
                            <span className="ml-2 text-sm text-gray-900">{log.action}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {log.ipAddress || 'Unknown'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center">
                            {getDeviceIcon(getDeviceType(log.userAgent))}
                            <span className="ml-2">{getDeviceType(log.userAgent)}</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {userLogs.length === 0 && !logsLoading && (
              <div className="text-center py-8">
                <FaHistory className="text-4xl text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No logs found for this user</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Block User Modal */}
      {showBlockModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Block User - {userToBlock?.fname}
              </h3>
              <button
                onClick={() => {
                  setShowBlockModal(false);
                  setBlockReason('');
                  setUserToBlock(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <FaTimes className="text-xl" />
              </button>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Block Reason *
              </label>
              <textarea
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                placeholder="Enter the reason for blocking this user..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                rows="4"
                required
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowBlockModal(false);
                  setBlockReason('');
                  setUserToBlock(null);
                }}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => blockUser(userToBlock._id, blockReason)}
                disabled={!blockReason.trim() || blockReason.trim().length < 5}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Block User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagementWithLogs; 