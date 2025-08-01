import React, { useState } from "react";
import {
  FaBuilding,
  FaChartLine,
  FaCog,
  FaCrown,
  FaEnvelope,
  FaExclamationTriangle,
  FaEye,
  FaEyeSlash,
  FaLock,
  FaShieldAlt,
  FaSpinner,
  FaUsers,
  FaUserShield
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useAuth } from "../../../../context/AuthContext";
import { publicApiClient } from "../../../../services/apiServices";
import { ActivityLogger, BruteForceProtection, RateLimiter } from "../../../../utils/security";

const AdminLogin = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [captchaValue, setCaptchaValue] = useState("");
  const [captchaRequired, setCaptchaRequired] = useState(false);
  const [captchaImage, setCaptchaImage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [rateLimitCountdown, setRateLimitCountdown] = useState(0);
  const { login } = useAuth();
  const navigate = useNavigate();

  // Generate simple CAPTCHA
  const generateCaptcha = () => {
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Check if CAPTCHA should be required
  const checkCaptchaRequirement = (email) => {
    const identifier = email;

    // Check brute force protection
    if (BruteForceProtection.isLocked(identifier)) {
      return true;
    }

    // Check rate limiting
    const rateLimit = RateLimiter.checkRateLimit(identifier);
    if (!rateLimit.allowed) {
      return true;
    }

    // Check recent failed attempts
    const attempts = BruteForceProtection.attempts.get(identifier) || [];
    if (attempts.length >= 2) { // Require CAPTCHA after 2 failed attempts
      return true;
    }

    return false;
  };

  // Admin Login Handler
  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const identifier = formData.email;

    // Check if CAPTCHA is required
    if (checkCaptchaRequirement(formData.email)) {
      if (!captchaRequired) {
        setCaptchaRequired(true);
        setCaptchaImage(generateCaptcha());
        toast.warning("Too many login attempts. Please complete the security verification.");
        setIsLoading(false);
        return;
      }

      if (!captchaValue || captchaValue.toUpperCase() !== captchaImage) {
        toast.error("Invalid security code. Please try again.");
        setCaptchaValue("");
        setCaptchaImage(generateCaptcha());
        setIsLoading(false);
        return;
      }
    }

    try {
      // Check brute force protection
      if (BruteForceProtection.isLocked(identifier)) {
        const remainingTime = BruteForceProtection.getRemainingLockoutTime(identifier);
        throw new Error(`Account is locked. Please wait ${Math.ceil(remainingTime / 1000)} seconds.`);
      }

      // Check rate limiting
      const rateLimit = RateLimiter.checkRateLimit(identifier);
      if (!rateLimit.allowed) {
        setIsRateLimited(true);
        setRateLimitCountdown(60);
        throw new Error('Too many requests. Please wait 60 seconds before trying again.');
      }

      const response = await publicApiClient.post("/auth/login", {
        email: formData.email,
        password: formData.password,
      });

      const responseData = response.data;
      console.log("Admin Login Response:", responseData);

      // Extract the actual data from the nested structure
      const data = responseData.data || responseData;
      console.log("Extracted data:", data);

      // Validate Response
      if (!data.role || !data.id || !data.token) {
        console.error("Invalid response structure:", { data, responseData });
        toast.error("Login failed: Invalid server response.");
        return;
      }

      // Clear brute force attempts on successful login
      BruteForceProtection.clearAttempts(identifier);

      // Log successful login
      ActivityLogger.logActivity(data.id, 'admin_login_success', {
        email: formData.email,
        timestamp: new Date().toISOString()
      });

      // ✅ Store token in localStorage
      localStorage.setItem("token", data.token);

      // ✅ Login with userData and token
      const userData = {
        userId: data.id,
        role: data.role,
        email: formData.email
      };
      login(userData, data.token);

      toast.success("Admin logged in successfully!");
      navigate("/admin/dashboard");
    } catch (error) {
      console.error("Login Error:", error);

      // Handle rate limiting specifically
      if (error.response?.status === 429) {
        setIsRateLimited(true);
        setRateLimitCountdown(60);

        // Start countdown timer
        const countdownInterval = setInterval(() => {
          setRateLimitCountdown(prev => {
            if (prev <= 1) {
              clearInterval(countdownInterval);
              setIsRateLimited(false);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);

        toast.error("Too many login attempts. Please wait 60 seconds before trying again.");
        setIsLoading(false);
        return;
      }

      // Record failed login attempt
      const attempt = BruteForceProtection.recordAttempt(identifier);

      if (attempt.isLocked) {
        toast.error(`Too many failed attempts. Account locked for ${Math.ceil(attempt.remainingTime / 1000)} seconds.`);
      } else {
        toast.error(error.response?.data?.message || error.message || "An error occurred during login.");
      }

      // Log failed login
      ActivityLogger.logActivity(null, 'admin_login_failed', {
        email: formData.email,
        reason: error.response?.data?.message || error.message,
        timestamp: new Date().toISOString()
      });

      // Show CAPTCHA if not already shown
      if (!captchaRequired) {
        setCaptchaRequired(true);
        setCaptchaImage(generateCaptcha());
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 left-1/4 w-80 h-80 bg-pink-500/20 rounded-full blur-3xl animate-pulse delay-500"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-purple-400/10 to-indigo-400/10 rounded-full blur-3xl animate-spin-slow"></div>
      </div>

      {/* Floating Icons */}
      <div className="absolute inset-0 pointer-events-none">
        <FaCrown className="absolute top-20 left-20 text-purple-400/40 text-2xl animate-bounce" />
        <FaBuilding className="absolute top-40 right-40 text-indigo-400/40 text-xl animate-pulse" />
        <FaChartLine className="absolute bottom-40 left-40 text-pink-400/40 text-2xl animate-bounce delay-1000" />
        <FaUsers className="absolute bottom-20 right-20 text-purple-400/40 text-xl animate-pulse delay-500" />
        <FaCog className="absolute top-1/3 right-1/4 text-indigo-400/30 text-lg animate-bounce delay-700" />
      </div>

      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-6xl bg-white/10 backdrop-blur-2xl rounded-3xl shadow-2xl overflow-hidden border border-white/20">
          <div className="flex flex-col lg:flex-row min-h-[700px]">
            {/* Left Side - Admin Dashboard Preview */}
            <div className="lg:w-1/2 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/95 via-purple-600/95 to-pink-600/95"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-white p-8 space-y-8">
                  <div className="space-y-4">
                    <div className="inline-flex items-center justify-center w-24 h-24 bg-white/20 backdrop-blur-sm rounded-full mb-6">
                      <FaCrown className="text-4xl text-white" />
                    </div>
                    <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
                      Admin Portal
                    </h1>
                    <p className="text-2xl opacity-90 mb-8 font-light">Secure Management Dashboard</p>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-center justify-center space-x-4 p-4 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20">
                      <FaUsers className="text-2xl text-purple-300" />
                      <span className="text-lg font-medium">User Management</span>
                    </div>
                    <div className="flex items-center justify-center space-x-4 p-4 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20">
                      <FaChartLine className="text-2xl text-indigo-300" />
                      <span className="text-lg font-medium">Analytics & Reports</span>
                    </div>
                    <div className="flex items-center justify-center space-x-4 p-4 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20">
                      <FaCog className="text-2xl text-pink-300" />
                      <span className="text-lg font-medium">System Settings</span>
                    </div>
                  </div>

                  <div className="mt-8 p-6 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20">
                    <p className="text-sm opacity-80">Access powerful administrative tools and comprehensive system management</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="lg:w-1/2 p-8 lg:p-12 bg-white/95 backdrop-blur-xl">
              <div className="max-w-md mx-auto">
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full mb-6 shadow-lg">
                    <FaUserShield className="text-3xl text-white" />
                  </div>
                  <h2 className="text-3xl font-bold text-gray-800 mb-3">Admin Access</h2>
                  <p className="text-gray-600 text-lg">Enter your credentials to access the admin dashboard</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                  {/* Email Field */}
                  <div className="relative group">
                    <input
                      type="email"
                      name="email"
                      placeholder="Admin Email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-6 py-4 pl-14 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-indigo-500 transition-all duration-300 bg-white/80 backdrop-blur-sm group-hover:bg-white"
                      required
                      disabled={isLoading || isRateLimited}
                    />
                    <FaEnvelope className="absolute left-5 top-1/2 -translate-y-1/2 text-indigo-500 text-xl" />
                  </div>

                  {/* Password Field */}
                  <div className="relative group">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      placeholder="Admin Password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className="w-full px-6 py-4 pl-14 pr-14 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-indigo-500 transition-all duration-300 bg-white/80 backdrop-blur-sm group-hover:bg-white"
                      required
                      disabled={isLoading || isRateLimited}
                    />
                    <FaLock className="absolute left-5 top-1/2 -translate-y-1/2 text-indigo-500 text-xl" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-indigo-600 transition-colors duration-200"
                      disabled={isLoading || isRateLimited}
                    >
                      {showPassword ? <FaEyeSlash className="text-xl" /> : <FaEye className="text-xl" />}
                    </button>
                  </div>

                  {/* Security Verification */}
                  {captchaRequired && (
                    <div className="space-y-4 animate-fadeIn">
                      <div className="text-center">
                        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center justify-center gap-2">
                          <FaShieldAlt className="text-indigo-600" />
                          Security Verification
                        </label>
                        <div className="flex items-center justify-center space-x-3">
                          <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-2xl text-center font-mono text-2xl font-bold tracking-wider text-indigo-700 shadow-lg">
                            {captchaImage}
                          </div>
                          <button
                            type="button"
                            onClick={() => setCaptchaImage(generateCaptcha())}
                            className="p-3 bg-indigo-100 hover:bg-indigo-200 rounded-2xl transition-colors duration-200 text-indigo-600 hover:text-indigo-700"
                            disabled={isLoading || isRateLimited}
                          >
                            <FaShieldAlt className="text-xl" />
                          </button>
                        </div>
                      </div>
                      <div className="relative group">
                        <input
                          type="text"
                          placeholder="Enter the security code"
                          value={captchaValue}
                          onChange={(e) => setCaptchaValue(e.target.value)}
                          className="w-full px-6 py-4 pl-14 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-indigo-500 transition-all duration-300 bg-white/80 backdrop-blur-sm group-hover:bg-white"
                          required={captchaRequired}
                          disabled={isLoading || isRateLimited}
                        />
                        <FaShieldAlt className="absolute left-5 top-1/2 -translate-y-1/2 text-indigo-500 text-xl" />
                      </div>
                    </div>
                  )}

                  {/* Security Notice */}
                  <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-200">
                    <div className="flex items-start space-x-3">
                      <FaExclamationTriangle className="text-indigo-600 text-lg mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold text-indigo-800 mb-1">Security Notice</h4>
                        <p className="text-sm text-indigo-700">
                          This is a secure admin portal. All login attempts are monitored and logged for security purposes.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Login Button */}
                  <button
                    type="submit"
                    className={`w-full py-4 font-bold rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl text-lg ${isRateLimited
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700'
                      } text-white`}
                    disabled={isLoading || isRateLimited}
                  >
                    {isRateLimited ? (
                      `Rate Limited (${rateLimitCountdown}s)`
                    ) : isLoading ? (
                      <div className="flex items-center justify-center gap-3">
                        <FaSpinner className="animate-spin text-xl" />
                        Authenticating...
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-3">
                        <FaUserShield />
                        Access Admin Portal
                      </div>
                    )}
                  </button>
                </form>

                {/* Back to Main Site */}
                <div className="mt-8 text-center">
                  <button
                    onClick={() => navigate('/')}
                    className="text-indigo-600 hover:text-indigo-700 font-medium transition-colors duration-200"
                  >
                    ← Back to Main Site
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin-slow {
          from {
            transform: translate(-50%, -50%) rotate(0deg);
          }
          to {
            transform: translate(-50%, -50%) rotate(360deg);
          }
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-spin-slow {
          animation: spin-slow 20s linear infinite;
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
      `}</style>
    </div>
  );
};

export default AdminLogin;
