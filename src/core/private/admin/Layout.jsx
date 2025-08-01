import React from "react";
import {
  FaBoxOpen,
  FaChartBar,
  FaExclamationCircle,
  FaSignOutAlt,
  FaTachometerAlt,
  FaUsers,
} from "react-icons/fa";
import { Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";

const Layout = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/admin/login");
  };

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <nav className="w-full md:w-1/5 bg-white text-black flex flex-col h-full fixed top-0 left-0 z-10">
        <div className="p-6 flex items-center justify-center">
          <img src="/assets/images/logo.png" alt="Thrift Store Logo" className="h-16 md:h-24 lg:h-32 w-auto" />
        </div>


        <ul className="flex-1 space-y-6 p-4">
          <li>
            <button
              onClick={() => navigate("/admin/dashboard")}
              className="w-full text-left px-4 py-2 rounded flex items-center hover:bg-purple-600 hover:text-white text-lg"
            >
              <FaTachometerAlt className="mr-3 text-gray-600" />
              Dashboard
            </button>
          </li>
          <li>
            <button
              onClick={() => navigate("/admin/users")}
              className="w-full text-left px-4 py-2 rounded flex items-center hover:bg-purple-600 hover:text-white text-lg"
            >
              <FaUsers className="mr-3 text-gray-600" />
              User Management
            </button>
          </li>
          <li>
            <button
              onClick={() => navigate("/admin/products")}
              className="w-full text-left px-4 py-2 rounded flex items-center hover:bg-purple-600 hover:text-white text-lg"
            >
              <FaBoxOpen className="mr-3 text-gray-600" />
              Product Management
            </button>
          </li>
          <li>
            <button
              onClick={() => navigate("/admin/disputes")}
              className="w-full text-left px-4 py-2 rounded flex items-center hover:bg-purple-600 hover:text-white text-lg"
            >
              <FaExclamationCircle className="mr-3 text-gray-600" />
              Dispute Management
            </button>
          </li>
          <li>
            <button
              onClick={() => navigate("/admin/analytics")}
              className="w-full text-left px-4 py-2 rounded flex items-center hover:bg-purple-600 hover:text-white text-lg"
            >
              <FaChartBar className="mr-3 text-gray-600" />
              Analytics
            </button>
          </li>
        </ul>

        <div className="p-4">
          <button
            onClick={handleLogout}
            className="w-full text-left px-4 py-2 rounded flex items-center bg-red-600 hover:bg-red-700 hover:text-white text-lg"
          >
            <FaSignOutAlt className="mr-3 text-white" />
            Logout
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="ml-auto md:ml-[20%] w-full md:w-[80%] bg-gray-100 h-screen overflow-y-auto p-6">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
