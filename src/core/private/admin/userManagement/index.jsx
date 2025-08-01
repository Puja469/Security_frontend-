import React, { useState } from "react";
import UserTable from "./Table";
import UserForm from "./Form";
import UserLogs from "./UserLogs";

const UserManagement = () => {
  const [activeTab, setActiveTab] = useState('users');
  const [selectedUser, setSelectedUser] = useState(null);

  const handleUserSelect = (user) => {
    setSelectedUser(user);
    setActiveTab('logs');
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-gray-900">User Management</h1>
      
      {/* Tab Navigation */}
      <div className="mb-6">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('users')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'users'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Users
          </button>
          {selectedUser && (
            <button
              onClick={() => setActiveTab('logs')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'logs'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Activity Logs - {selectedUser.fname}
            </button>
          )}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'users' && (
        <div>
          <UserForm />
          <div className="mt-6">
            <UserTable onUserSelect={handleUserSelect} />
          </div>
        </div>
      )}

      {activeTab === 'logs' && selectedUser && (
        <div>
          <div className="mb-4">
            <button
              onClick={() => setActiveTab('users')}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Users
            </button>
          </div>
          <UserLogs userId={selectedUser._id} userName={selectedUser.fname} />
        </div>
      )}
    </div>
  );
};

export default UserManagement;
