import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ children, requiredRole }) => {
  const { isLoggedIn, role } = useAuth();

  console.log("🔒 ProtectedRoute Security Check:");
  console.log("isLoggedIn:", isLoggedIn);
  console.log("currentRole:", role);
  console.log("requiredRole:", requiredRole);

  // Check if user is logged in
  if (!isLoggedIn) {
    console.log("❌ User not logged in, redirecting to register page");
    return <Navigate to="/register" replace />;
  }

  // Check if user has the required role
  if (role !== requiredRole.toLowerCase()) {
    console.log(`❌ Role mismatch: ${role} !== ${requiredRole.toLowerCase()}`);

    // Redirect based on required role
    if (requiredRole.toLowerCase() === "admin") {
      console.log("🔀 Redirecting to admin login");
      return <Navigate to="/admin/login" replace />;
    } else {
      console.log("🔀 Redirecting to user register page");
      return <Navigate to="/register" replace />;
    }
  }

  console.log("✅ Access granted - user authenticated and authorized");
  return children;
};

export default ProtectedRoute;
