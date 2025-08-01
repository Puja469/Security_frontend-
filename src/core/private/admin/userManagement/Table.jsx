import React, { useState, useEffect } from "react";
import { getAllUsers, blockUser, unblockUser, getUserDetails } from "../../../../services/adminApi";

const UserTable = ({ onUserSelect }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalUsers: 0,
    hasNextPage: false,
    hasPrevPage: false,
    limit: 10
  });
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [blockReason, setBlockReason] = useState('');
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  // Fetch users with pagination and filters
  const fetchUsers = async (page = 1, newFilters = null) => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        page,
        limit: pagination.limit,
        ...(newFilters || filters)
      };

      const response = await getAllUsers(params);
      
      if (response.status === "success") {
        setUsers(response.data.users);
        setPagination(response.data.pagination);
      } else {
        throw new Error(response.message || "Failed to fetch users");
      }
    } catch (error) {
      console.error("❌ Error fetching users:", error);
      setError(error.message || "Failed to load users");
      
      // Set fallback data for development/demo purposes
      setUsers([
        {
          _id: '1',
          fname: 'John Doe',
          email: 'john@example.com',
          phone: '1234567890',
          city: 'New York',
          isBlocked: false,
          isLocked: false,
          createdAt: '2024-01-01T00:00:00.000Z',
          blockedBy: null,
          blockedAt: null,
          blockReason: null
        },
        {
          _id: '2',
          fname: 'Jane Smith',
          email: 'jane@example.com',
          phone: '0987654321',
          city: 'Los Angeles',
          isBlocked: true,
          isLocked: false,
          createdAt: '2024-01-02T00:00:00.000Z',
          blockedBy: 'admin',
          blockedAt: '2024-01-15T00:00:00.000Z',
          blockReason: 'Violation of terms'
        }
      ]);
      setPagination({
        currentPage: 1,
        totalPages: 1,
        totalUsers: 2,
        hasNextPage: false,
        hasPrevPage: false,
        limit: 10
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    fetchUsers(1, newFilters);
  };

  // Handle pagination
  const handlePageChange = (page) => {
    fetchUsers(page);
  };

  // Handle user blocking
  const handleBlockUser = async (userId) => {
    if (!blockReason.trim()) {
      alert('Please provide a reason for blocking the user');
      return;
    }

    try {
      setActionLoading(userId);
      const response = await blockUser(userId, blockReason);
      
      if (response.status === "success") {
        // Update the user in the list
        setUsers(users.map(user => 
          user._id === userId 
            ? { ...user, isBlocked: true, blockReason, blockedAt: new Date().toISOString() }
            : user
        ));
        setShowBlockModal(false);
        setBlockReason('');
        alert('User blocked successfully');
      } else {
        throw new Error(response.message || "Failed to block user");
      }
    } catch (error) {
      console.error("❌ Error blocking user:", error);
      alert(error.message || "Failed to block user");
    } finally {
      setActionLoading(null);
    }
  };

  // Handle user unblocking
  const handleUnblockUser = async (userId) => {
    try {
      setActionLoading(userId);
      const response = await unblockUser(userId);
      
      if (response.status === "success") {
        // Update the user in the list
        setUsers(users.map(user => 
          user._id === userId 
            ? { ...user, isBlocked: false, blockReason: null, blockedAt: null }
            : user
        ));
        alert('User unblocked successfully');
      } else {
        throw new Error(response.message || "Failed to unblock user");
      }
    } catch (error) {
      console.error("❌ Error unblocking user:", error);
      alert(error.message || "Failed to unblock user");
    } finally {
      setActionLoading(null);
    }
  };

  // Handle user details view
  const handleViewDetails = async (userId) => {
    try {
      const response = await getUserDetails(userId);
      if (response.status === "success") {
        setSelectedUser(response.data);
        setShowUserDetails(true);
      } else {
        throw new Error(response.message || "Failed to fetch user details");
      }
    } catch (error) {
      console.error("❌ Error fetching user details:", error);
      alert(error.message || "Failed to fetch user details");
    }
  };

  // Get status badge
  const getStatusBadge = (user) => {
    if (user.isBlocked) {
      return (
        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
          Blocked
        </span>
      );
    }
    if (user.isLocked) {
      return (
        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
          Locked
        </span>
      );
    }
    return (
      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
        Active
      </span>
    );
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <span className="ml-3 text-gray-600">Loading users...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">User Management</h2>
        <div className="text-sm text-gray-600">
          Total Users: {pagination.totalUsers}
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
          <input
            type="text"
            placeholder="Search by name, email, phone, city..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Users</option>
            <option value="active">Active</option>
            <option value="blocked">Blocked</option>
            <option value="locked">Locked</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
          <select
            value={filters.sortBy}
            onChange={(e) => handleFilterChange('sortBy', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="createdAt">Created Date</option>
            <option value="fname">Name</option>
            <option value="email">Email</option>
            <option value="city">City</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Order</label>
          <select
            value={filters.sortOrder}
            onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error loading users</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                        <span className="text-sm font-medium text-indigo-600">
                          {user.fname?.charAt(0)?.toUpperCase() || 'U'}
                        </span>
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
                  <div className="text-sm text-gray-500">{user.city}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(user)}
                  {user.isBlocked && user.blockReason && (
                    <div className="text-xs text-gray-500 mt-1">
                      Reason: {user.blockReason}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleViewDetails(user._id)}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      View
                    </button>
                    
                    <button
                      onClick={() => onUserSelect && onUserSelect(user)}
                      className="text-purple-600 hover:text-purple-900"
                    >
                      Logs
                    </button>
                    
                    {!user.isBlocked ? (
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setShowBlockModal(true);
                        }}
                        disabled={actionLoading === user._id}
                        className="text-red-600 hover:text-red-900 disabled:opacity-50"
                      >
                        {actionLoading === user._id ? 'Blocking...' : 'Block'}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleUnblockUser(user._id)}
                        disabled={actionLoading === user._id}
                        className="text-green-600 hover:text-green-900 disabled:opacity-50"
                      >
                        {actionLoading === user._id ? 'Unblocking...' : 'Unblock'}
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
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => handlePageChange(pagination.currentPage - 1)}
              disabled={!pagination.hasPrevPage}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => handlePageChange(pagination.currentPage + 1)}
              disabled={!pagination.hasNextPage}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing page <span className="font-medium">{pagination.currentPage}</span> of{' '}
                <span className="font-medium">{pagination.totalPages}</span>
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={!pagination.hasPrevPage}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={!pagination.hasNextPage}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Block User Modal */}
      {showBlockModal && selectedUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Block User</h3>
              <p className="text-sm text-gray-600 mb-4">
                Are you sure you want to block <strong>{selectedUser.fname}</strong>?
              </p>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for blocking (required)
                </label>
                <textarea
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  placeholder="Enter the reason for blocking this user..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  rows="3"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowBlockModal(false);
                    setBlockReason('');
                    setSelectedUser(null);
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleBlockUser(selectedUser._id)}
                  disabled={!blockReason.trim() || actionLoading === selectedUser._id}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                >
                  {actionLoading === selectedUser._id ? 'Blocking...' : 'Block User'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Details Modal */}
      {showUserDetails && selectedUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">User Details</h3>
                <button
                  onClick={() => {
                    setShowUserDetails(false);
                    setSelectedUser(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-700">Name:</label>
                  <p className="text-sm text-gray-900">{selectedUser.fname}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Email:</label>
                  <p className="text-sm text-gray-900">{selectedUser.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Phone:</label>
                  <p className="text-sm text-gray-900">{selectedUser.phone}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">City:</label>
                  <p className="text-sm text-gray-900">{selectedUser.city}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Status:</label>
                  <div className="mt-1">{getStatusBadge(selectedUser)}</div>
                </div>
                {selectedUser.isBlocked && (
                  <>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Block Reason:</label>
                      <p className="text-sm text-gray-900">{selectedUser.blockReason}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Blocked At:</label>
                      <p className="text-sm text-gray-900">
                        {new Date(selectedUser.blockedAt).toLocaleString()}
                      </p>
                    </div>
                  </>
                )}
                <div>
                  <label className="text-sm font-medium text-gray-700">Created:</label>
                  <p className="text-sm text-gray-900">
                    {new Date(selectedUser.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserTable;
