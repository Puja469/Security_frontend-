import { useMutation, useQueryClient } from "@tanstack/react-query";
import React, { useEffect, useState } from "react";
import { FaEnvelope, FaEye, FaEyeSlash, FaHeart, FaLeaf, FaLock, FaMapMarkerAlt, FaPhone, FaShieldAlt, FaShoppingBag, FaStar, FaUser } from "react-icons/fa";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import PasswordStrengthIndicator from "../../components/PasswordStrengthIndicator";
import { useAuth } from "../../context/AuthContext";
import {
  isTokenValid,
  loginUser,
  registerUser,
  resetPassword,
  sendPasswordResetOtp,
  verifyLoginOTP,
  verifyOtp
} from "../../services/apiServices";
import {
  ActivityLogger,
  BruteForceProtection,
  OTPBruteForceProtection,
  OTPRateLimiter,
  RateLimiter,
  sanitizeInput,
  SecurityValidator,
  validatePassword
} from "../../utils/security";

function Register() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("signup");
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    city: "",
    password: "",
    confirmPassword: "",
    phoneNumber: "",
  });

  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });
  const [loginUserId, setLoginUserId] = useState(null);

  const [otp, setOtp] = useState("");
  const [showOtpField, setShowOtpField] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [resetData, setResetData] = useState({ email: "", otp: "", newPassword: "" });
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [showForgotPasswordForm, setShowForgotPasswordForm] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [passwordValidation, setPasswordValidation] = useState({ isValid: false, errors: [], strength: null });
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isLoginLocked, setIsLoginLocked] = useState(false);
  const [captchaValue, setCaptchaValue] = useState("");
  const [captchaRequired, setCaptchaRequired] = useState(false);
  const [captchaImage, setCaptchaImage] = useState("");
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [rateLimitCountdown, setRateLimitCountdown] = useState(0);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Monitor location changes for debugging
  useEffect(() => {
    console.log("📍 Register component location changed:", location.pathname);
  }, [location.pathname]);

  // Generate simple CAPTCHA
  const generateCaptcha = () => {
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  useEffect(() => {
    setIsAnimating(true);
    const timer = setTimeout(() => setIsAnimating(false), 1000);
    return () => clearTimeout(timer);
  }, [activeTab]);

  // Password validation effect
  useEffect(() => {
    if (formData.password) {
      const validation = validatePassword(formData.password, formData.confirmPassword);
      setPasswordValidation(validation);
    }
  }, [formData.password, formData.confirmPassword]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const sanitizedValue = sanitizeInput(value);
    setFormData({ ...formData, [name]: sanitizedValue });
  };

  const handleLoginChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (type === 'checkbox') {
      setLoginData({ ...loginData, [name]: checked });
    } else {
      const sanitizedValue = sanitizeInput(value);
      setLoginData({ ...loginData, [name]: sanitizedValue });
    }
  };

  const loginMutation = useMutation({
    mutationFn: async (loginData) => {
      // Check brute force protection
      const identifier = loginData.email;
      if (BruteForceProtection.isLocked(identifier)) {
        const remainingTime = BruteForceProtection.getRemainingLockoutTime(identifier);
        throw new Error(`Account is locked. Please wait ${Math.ceil(remainingTime / 1000)} seconds.`);
      }

      // Check rate limiting
      const rateLimit = RateLimiter.checkRateLimit(identifier);
      if (!rateLimit.allowed) {
        throw new Error('Too many requests. Please wait before trying again.');
      }

      return loginUser(loginData);
    },
    onSuccess: (data) => {
      console.log("🔐 Login response received:", data);

      // Check if 2FA is required
      if (data.message && data.message.includes("OTP sent to your email")) {
        console.log("🔐 2FA required - showing OTP field");
        console.log("🔐 Login response data:", data.data);

        // Store the userId for OTP verification
        if (data.data && data.data.userId) {
          setLoginUserId(data.data.userId);
          console.log("🔐 Stored userId for OTP verification:", data.data.userId);
        }

        toast.info("Please check your email for OTP verification");
        setShowOtpField(true);
        return;
      }

      // Check if we have the required data for complete login
      if (!data.token || !data.userId) {
        console.log("❌ Incomplete login data received:", data);
        toast.error("Login incomplete. Please try again.");
        return;
      }

      // Clear brute force attempts on successful login
      BruteForceProtection.clearAttempts(loginData.email);

      // Log successful login
      ActivityLogger.logActivity(data.userId, 'login_success', {
        email: loginData.email,
        timestamp: new Date().toISOString()
      });

      // Set authentication data in localStorage first
      localStorage.setItem("token", data.token);
      localStorage.setItem("userId", data.userId);
      localStorage.setItem("role", data.role || "user");
      localStorage.setItem("isLoggedIn", "true");
      localStorage.setItem("lastLoginTime", Date.now().toString());
      localStorage.setItem("justLoggedIn", "true");

      console.log("🔐 Token stored:", data.token);
      console.log("✅ isTokenValid:", isTokenValid(data.token));
      console.log("🔍 localStorage after login:", {
        token: localStorage.getItem("token") ? `${localStorage.getItem("token").substring(0, 20)}...` : 'null',
        userId: localStorage.getItem("userId"),
        isLoggedIn: localStorage.getItem("isLoggedIn"),
        role: localStorage.getItem("role")
      });

      // Update AuthContext
      login(data, data.token);

      toast.success("Login successful!");
      setLoginData({
        email: "",
        password: "",
        rememberMe: false,
      });

      // Invalidate and refetch user-related queries
      queryClient.invalidateQueries(["userDetails"]);
      queryClient.invalidateQueries(["notifications"]);

      // Use direct navigation to ensure it works
      setTimeout(() => {
        console.log("🚀 Navigating to home page after successful login");
        console.log("Current location before navigation:", window.location.pathname);

        // Use direct navigation to ensure it works
        window.location.href = "/";
      }, 1000); // Increased delay to ensure AuthContext updates

      // Clear the flag after 10 seconds to allow normal API calls
      setTimeout(() => {
        localStorage.removeItem("justLoggedIn");
        console.log("✅ justLoggedIn flag cleared");
      }, 10000);
    },
    onError: (error) => {
      console.log("❌ Login error:", {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });

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
        return;
      }

      // Record failed login attempt
      const identifier = loginData.email;
      const attempt = BruteForceProtection.recordAttempt(identifier);

      if (attempt.isLocked) {
        toast.error(`Too many failed attempts. Account locked for ${Math.ceil(attempt.remainingTime / 1000)} seconds.`);
      } else {
        toast.error(error.response?.data?.message || "Login failed");
      }

      // Log failed login
      ActivityLogger.logActivity(null, 'login_failed', {
        email: loginData.email,
        reason: error.message,
        timestamp: new Date().toISOString()
      });
    },
  });

  const handleLogin = (e) => {
    e.preventDefault();

    // Validate email format
    if (!SecurityValidator.validateEmail(loginData.email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    // Check if password is empty
    if (!loginData.password.trim()) {
      toast.error("Please enter your password");
      return;
    }

    loginMutation.mutate(loginData);
  };



  const signUpMutation = useMutation({
    mutationFn: async (registrationData) => {
      // Validate all inputs
      if (!SecurityValidator.validateEmail(registrationData.email)) {
        throw new Error("Please enter a valid email address");
      }

      if (!SecurityValidator.validatePhone(registrationData.phone)) {
        throw new Error("Please enter a valid phone number");
      }

      if (!SecurityValidator.validateName(registrationData.fname)) {
        throw new Error("Please enter a valid name (letters and spaces only)");
      }

      return registerUser(registrationData);
    },
    onSuccess: (data) => {
      // Log successful registration
      ActivityLogger.logActivity(data.userId, 'registration_success', {
        email: formData.email,
        timestamp: new Date().toISOString()
      });

      toast.success("Registration successful! Check your email for OTP.");
      setShowOtpField(true);
    },
    onError: (error) => {
      // Log failed registration
      ActivityLogger.logActivity(null, 'registration_failed', {
        email: formData.email,
        reason: error.message,
        timestamp: new Date().toISOString()
      });

      // Show CAPTCHA on registration failure to prevent bot abuse
      if (!captchaRequired) {
        setCaptchaRequired(true);
        setCaptchaImage(generateCaptcha());
        toast.warning("Please complete the security verification and try again.");
      } else {
        toast.error(error.response?.data?.message || "Registration failed");
      }
    },
  });

  const handleSignUp = (e) => {
    e.preventDefault();

    // Check if CAPTCHA is required and validate it
    if (captchaRequired) {
      if (!captchaValue || captchaValue.toUpperCase() !== captchaImage) {
        toast.error("Invalid CAPTCHA. Please try again.");
        setCaptchaValue("");
        setCaptchaImage(generateCaptcha());
        return;
      }
    }

    // Validate password
    if (!passwordValidation.isValid) {
      toast.error("Please fix password validation errors");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match!");
      return;
    }

    const registrationData = {
      fname: formData.fullName,
      email: formData.email,
      phone: formData.phoneNumber,
      city: formData.city,
      password: formData.password,
    };

    signUpMutation.mutate(registrationData);
  };

  const verifyOtpMutation = useMutation({
    mutationFn: async (otpData) => {
      // Use OTP-specific security checks (more lenient)
      const identifier = otpData.email;

      // Check OTP brute force protection
      if (OTPBruteForceProtection.isLocked(identifier)) {
        const remainingTime = OTPBruteForceProtection.getRemainingLockoutTime(identifier);
        throw new Error(`OTP verification is locked. Please wait ${Math.ceil(remainingTime / 1000)} seconds.`);
      }

      // Check OTP rate limiting
      const rateLimit = OTPRateLimiter.checkRateLimit(identifier);
      if (!rateLimit.allowed) {
        throw new Error('Too many OTP verification attempts. Please wait before trying again.');
      }

      return verifyOtp(otpData);
    },
    onSuccess: (data) => {
      // Clear OTP brute force attempts on successful verification
      OTPBruteForceProtection.clearAttempts(formData.email);

      // Log successful email verification
      ActivityLogger.logActivity(data.userId, 'email_verification_success', {
        email: formData.email,
        timestamp: new Date().toISOString()
      });

      toast.success("Email verified successfully! Please log in.");
      setShowOtpField(false);
    },
    onError: (error) => {
      // Record failed OTP attempt
      const identifier = formData.email;
      const attempt = OTPBruteForceProtection.recordAttempt(identifier);

      if (attempt.isLocked) {
        toast.error(`Too many failed OTP attempts. Please wait ${Math.ceil(attempt.remainingTime / 1000)} seconds.`);
      } else {
        toast.error(error.response?.data?.message || "Invalid OTP");
      }

      // Log failed email verification
      ActivityLogger.logActivity(null, 'email_verification_failed', {
        email: formData.email,
        reason: error.message,
        timestamp: new Date().toISOString()
      });
    },
  });

  const handleVerifyOtp = (e) => {
    e.preventDefault();
    const otpData = { email: formData.email, otp };
    verifyOtpMutation.mutate(otpData);
  };

  // Login OTP verification mutation for 2FA
  const loginOtpMutation = useMutation({
    mutationFn: async (otpData) => {
      // Use OTP-specific security checks for login verification
      const identifier = otpData.email;

      // Check OTP brute force protection
      if (OTPBruteForceProtection.isLocked(identifier)) {
        const remainingTime = OTPBruteForceProtection.getRemainingLockoutTime(identifier);
        throw new Error(`OTP verification is locked. Please wait ${Math.ceil(remainingTime / 1000)} seconds.`);
      }

      // Check OTP rate limiting
      const rateLimit = OTPRateLimiter.checkRateLimit(identifier);
      if (!rateLimit.allowed) {
        throw new Error('Too many OTP verification attempts. Please wait before trying again.');
      }

      return verifyLoginOTP(otpData);
    },
    onSuccess: (data) => {
      console.log("🔐 OTP verification response:", data);

      // Check if we have the required data
      if (!data.data || !data.data.token || !data.data.id) {
        console.error("❌ Missing required data in OTP response:", data);
        toast.error("Login incomplete. Please try again.");
        return;
      }

      // Clear OTP brute force attempts on successful verification
      OTPBruteForceProtection.clearAttempts(loginData.email);

      // Log successful login OTP verification
      ActivityLogger.logActivity(data.data.id, 'login_otp_verification_success', {
        email: loginData.email,
        timestamp: new Date().toISOString()
      });

      // Set authentication data in localStorage
      localStorage.setItem("token", data.data.token);
      localStorage.setItem("userId", data.data.id);
      localStorage.setItem("role", data.data.role || "user");
      localStorage.setItem("isLoggedIn", "true");
      localStorage.setItem("lastLoginTime", Date.now().toString());
      localStorage.setItem("justLoggedIn", "true");

      console.log("🔐 Login OTP verification successful:", {
        token: data.data.token ? `${data.data.token.substring(0, 20)}...` : 'null',
        userId: data.data.id,
        role: data.data.role
      });

      // Update AuthContext with correct data structure
      const userData = {
        userId: data.data.id,
        role: data.data.role || "user",
        token: data.data.token
      };

      console.log("🔐 Calling login function with:", userData);
      const loginResult = login(userData, data.data.token);
      console.log("🔐 Login function result:", loginResult);

      // Add detailed state verification
      setTimeout(() => {
        console.log("🔍 Post-login state verification:", {
          isLoggedIn: localStorage.getItem('isLoggedIn'),
          userId: localStorage.getItem('userId'),
          role: localStorage.getItem('role'),
          token: localStorage.getItem('token') ? 'present' : 'missing',
          tokenLength: localStorage.getItem('token')?.length
        });
      }, 200);

      toast.success("Login successful!");
      setShowOtpField(false);
      setLoginData({
        email: "",
        password: "",
        rememberMe: false,
      });

      // Invalidate and refetch user-related queries
      queryClient.invalidateQueries(["userDetails"]);
      queryClient.invalidateQueries(["notifications"]);

      // Navigate to home page
      setTimeout(() => {
        console.log("🚀 Navigating to home page after successful 2FA login");
        window.location.href = "/";
      }, 1000);

      // Clear the flag after 10 seconds to ensure auth state is stable
      setTimeout(() => {
        localStorage.removeItem("justLoggedIn");
        console.log("✅ justLoggedIn flag cleared");
      }, 10000);
    },
    onError: (error) => {
      console.log("❌ Login OTP verification error:", {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        fullError: error
      });

      // Log the exact error response for debugging
      console.log("🔍 Detailed error response:", {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: JSON.stringify(error.response?.data, null, 2),
        headers: error.response?.headers,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          data: error.config?.data
        }
      });

      // Record failed OTP attempt
      const identifier = loginData.email;
      const attempt = OTPBruteForceProtection.recordAttempt(identifier);

      if (attempt.isLocked) {
        toast.error(`Too many failed OTP attempts. Please wait ${Math.ceil(attempt.remainingTime / 1000)} seconds.`);
      } else {
        toast.error(error.response?.data?.message || "Invalid OTP");
      }

      // Log failed login OTP verification
      ActivityLogger.logActivity(null, 'login_otp_verification_failed', {
        email: loginData.email,
        reason: error.message,
        timestamp: new Date().toISOString()
      });
    },
  });

  const handleLoginOtp = (e) => {
    e.preventDefault();

    console.log("🔐 OTP Validation Debug:", {
      rawOtp: otp,
      otpType: typeof otp,
      otpLength: otp?.length,
      trimmedOtp: otp?.trim(),
      trimmedLength: otp?.trim()?.length,
      isOnlyDigits: /^\d+$/.test(otp?.trim() || ''),
      isExactly6Digits: /^\d{6}$/.test(otp?.trim() || '')
    });

    // Check if OTP is entered
    if (!otp || otp.trim() === '') {
      toast.error("Please enter the OTP code");
      return;
    }

    // Check if we have userId
    if (!loginUserId) {
      toast.error("Login session expired. Please login again.");
      setShowOtpField(false);
      return;
    }

    // More flexible OTP validation - allow both digits and alphanumeric
    const trimmedOtp = otp.trim();
    const isNumeric = /^\d{6}$/.test(trimmedOtp);
    const isAlphanumeric = /^[A-Za-z0-9]{6}$/.test(trimmedOtp);

    if (!isNumeric && !isAlphanumeric) {
      toast.error(`Please enter a valid 6-character OTP code. You entered: "${trimmedOtp}" (${trimmedOtp.length} characters)`);
      return;
    }

    // Send email and userId and OTP as expected by backend
    const otpData = {
      email: loginData.email,
      userId: loginUserId,
      otp: trimmedOtp.toUpperCase() // Convert to uppercase for consistency
    };
    console.log("🔐 Sending OTP verification data:", {
      email: otpData.email,
      userId: otpData.userId,
      otpLength: otpData.otp?.length,
      otp: otpData.otp,
      isNumeric: isNumeric,
      isAlphanumeric: isAlphanumeric,
      fullData: otpData
    });
    loginOtpMutation.mutate(otpData);
  };

  const forgotPasswordMutation = useMutation({
    mutationFn: async (email) => {
      return sendPasswordResetOtp(email);
    },
    onSuccess: (data) => {
      // Log password reset request
      ActivityLogger.logActivity(null, 'password_reset_requested', {
        email: forgotPasswordEmail,
        timestamp: new Date().toISOString()
      });

      toast.success("OTP sent to your email!");
      setShowResetPassword(true);
      setShowForgotPasswordForm(false);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Error sending OTP");
    },
  });

  const handleForgotPassword = (e) => {
    e.preventDefault();

    if (!SecurityValidator.validateEmail(forgotPasswordEmail)) {
      toast.error("Please enter a valid email address");
      return;
    }

    forgotPasswordMutation.mutate(forgotPasswordEmail);
  };

  const resetPasswordMutation = useMutation({
    mutationFn: async (resetData) => {
      // Use OTP-specific security checks for password reset
      const identifier = resetData.email;

      // Check OTP brute force protection
      if (OTPBruteForceProtection.isLocked(identifier)) {
        const remainingTime = OTPBruteForceProtection.getRemainingLockoutTime(identifier);
        throw new Error(`Password reset is locked. Please wait ${Math.ceil(remainingTime / 1000)} seconds.`);
      }

      // Check OTP rate limiting
      const rateLimit = OTPRateLimiter.checkRateLimit(identifier);
      if (!rateLimit.allowed) {
        throw new Error('Too many password reset attempts. Please wait before trying again.');
      }

      // Validate new password
      const validation = validatePassword(resetData.newPassword);
      if (!validation.isValid) {
        throw new Error("New password does not meet security requirements");
      }

      return resetPassword(resetData);
    },
    onSuccess: (data) => {
      // Clear OTP brute force attempts on successful password reset
      OTPBruteForceProtection.clearAttempts(resetData.email);

      // Log successful password reset
      ActivityLogger.logActivity(null, 'password_reset_success', {
        email: resetData.email,
        timestamp: new Date().toISOString()
      });

      toast.success("Password reset successful! Please log in.");
      setShowResetPassword(false);
      setShowForgotPasswordForm(false);
      setResetData({ email: "", otp: "", newPassword: "" });
    },
    onError: (error) => {
      // Record failed password reset attempt
      const identifier = resetData.email;
      const attempt = OTPBruteForceProtection.recordAttempt(identifier);

      if (attempt.isLocked) {
        toast.error(`Too many failed password reset attempts. Please wait ${Math.ceil(attempt.remainingTime / 1000)} seconds.`);
      } else {
        toast.error(error.response?.data?.message || "Password reset failed");
      }
    },
  });

  const handleResetPassword = (e) => {
    e.preventDefault();
    resetPasswordMutation.mutate(resetData);
  };

  // Debug function to test login flow
  const debugLoginFlow = () => {
    console.log("🔍 Debug Login Flow:");
    console.log("1. Current login data:", loginData);
    console.log("2. loginUserId:", loginUserId);
    console.log("3. showOtpField:", showOtpField);
    console.log("4. localStorage state:", {
      token: localStorage.getItem('token') ? 'present' : 'null',
      userId: localStorage.getItem('userId'),
      isLoggedIn: localStorage.getItem('isLoggedIn'),
      role: localStorage.getItem('role'),
      justLoggedIn: localStorage.getItem('justLoggedIn')
    });
    console.log("5. Secure session:", localStorage.getItem('secureSession') ? 'present' : 'null');
  };

  // Add debug button to UI (only in development)
  const DebugButton = () => {
    if (process.env.NODE_ENV === 'development') {
      return (
        <button
          type="button"
          onClick={debugLoginFlow}
          className="fixed top-4 right-4 bg-red-500 text-white px-2 py-1 rounded text-xs z-50"
        >
          Debug Login
        </button>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
      <DebugButton />
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-amber-300/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-96 h-96 bg-orange-300/30 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 left-1/4 w-80 h-80 bg-yellow-300/30 rounded-full blur-3xl animate-pulse delay-500"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-amber-400/20 to-orange-400/20 rounded-full blur-3xl animate-spin-slow"></div>
      </div>

      {/* Floating Icons */}
      <div className="absolute inset-0 pointer-events-none">
        <FaStar className="absolute top-20 left-20 text-amber-500/40 text-2xl animate-bounce" />
        <FaHeart className="absolute top-40 right-40 text-orange-500/40 text-xl animate-pulse" />
        <FaShoppingBag className="absolute bottom-40 left-40 text-yellow-600/40 text-2xl animate-bounce delay-1000" />
        <FaLeaf className="absolute bottom-20 right-20 text-green-600/40 text-xl animate-pulse delay-500" />
        <FaStar className="absolute top-1/3 right-1/4 text-amber-500/30 text-lg animate-bounce delay-700" />
        <FaHeart className="absolute bottom-1/3 left-1/3 text-orange-500/30 text-sm animate-pulse delay-300" />
      </div>

      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-7xl bg-white/80 backdrop-blur-2xl rounded-3xl shadow-2xl overflow-hidden border border-amber-200/30">
          <div className="flex flex-col lg:flex-row min-h-[700px]">
            {/* Left Side - Enhanced Hero Section */}
            <div className="lg:w-1/2 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-600/95 via-orange-600/95 to-yellow-600/95"></div>
              <img
                src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80"
                alt="Thrift Store"
                className="h-full w-full object-cover mix-blend-overlay"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-white p-8 space-y-8">
                  <div className="space-y-4">
                    <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-white to-amber-200 bg-clip-text text-transparent">
                      Welcome to Thrift Store
                    </h1>
                    <p className="text-2xl opacity-90 mb-8 font-light">Join our sustainable shopping community</p>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-center justify-center space-x-4 p-4 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20">
                      <FaShoppingBag className="text-2xl text-amber-300" />
                      <span className="text-lg font-medium">Discover amazing deals</span>
                    </div>
                    <div className="flex items-center justify-center space-x-4 p-4 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20">
                      <FaHeart className="text-2xl text-orange-300" />
                      <span className="text-lg font-medium">Connect with trusted sellers</span>
                    </div>
                    <div className="flex items-center justify-center space-x-4 p-4 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20">
                      <FaLeaf className="text-2xl text-green-400" />
                      <span className="text-lg font-medium">Shop sustainably</span>
                    </div>
                  </div>

                  <div className="mt-8 p-6 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20">
                    <p className="text-sm opacity-80">Join thousands of happy customers who have found their perfect items on our platform</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side - Enhanced Forms */}
            <div className="lg:w-1/2 p-8 lg:p-12 bg-white/95 backdrop-blur-xl">
              <div className="max-w-md mx-auto">
                {/* Enhanced Tab Navigation */}
                <div className="flex bg-gradient-to-r from-amber-100 to-orange-100 rounded-3xl p-2 mb-8 shadow-lg">
                  <button
                    className={`flex-1 py-4 px-6 rounded-2xl text-sm font-bold transition-all duration-500 transform ${activeTab === "login"
                      ? "bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-lg scale-105"
                      : "text-gray-600 hover:text-amber-600 hover:bg-white/50"
                      }`}
                    onClick={() => setActiveTab("login")}
                  >
                    Sign In
                  </button>
                  <button
                    className={`flex-1 py-4 px-6 rounded-2xl text-sm font-bold transition-all duration-500 transform ${activeTab === "signup"
                      ? "bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-lg scale-105"
                      : "text-gray-600 hover:text-amber-600 hover:bg-white/50"
                      }`}
                    onClick={() => setActiveTab("signup")}
                  >
                    Sign Up
                  </button>
                </div>

                {/* Enhanced Forms */}
                <div className={`space-y-6 transition-all duration-500 ${isAnimating ? 'opacity-50 scale-95' : 'opacity-100 scale-100'}`}>
                  {showOtpField && activeTab === "signup" ? (
                    <div className="space-y-6 animate-fadeIn">
                      <div className="text-center">
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-amber-600 to-orange-600 rounded-full mb-6 shadow-lg">
                          <FaShieldAlt className="text-3xl text-white" />
                        </div>
                        <h2 className="text-3xl font-bold text-gray-800 mb-3">Verify Your Email</h2>
                        <p className="text-gray-600 text-lg">We've sent a verification code to your email</p>
                      </div>
                      <form onSubmit={handleVerifyOtp} className="space-y-6">
                        <div className="relative group">
                          <input
                            type="text"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            placeholder="Enter 6-digit OTP"
                            className="w-full px-6 py-4 pl-14 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-amber-500 transition-all duration-300 bg-white/80 backdrop-blur-sm group-hover:bg-white"
                            required
                          />
                          <FaShieldAlt className="absolute left-5 top-1/2 -translate-y-1/2 text-amber-500 text-xl" />
                        </div>
                        <button
                          type="submit"
                          className="w-full py-4 bg-gradient-to-r from-amber-600 to-orange-600 text-white font-bold rounded-2xl hover:from-amber-700 hover:to-orange-700 transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl text-lg"
                        >
                          Verify OTP
                        </button>
                      </form>
                    </div>
                  ) : showResetPassword ? (
                    <div className="space-y-6 animate-fadeIn">
                      <div className="text-center">
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-amber-600 to-orange-600 rounded-full mb-6 shadow-lg">
                          <FaLock className="text-3xl text-white" />
                        </div>
                        <h2 className="text-3xl font-bold text-gray-800 mb-3">Reset Password</h2>
                        <p className="text-gray-600 text-lg">Enter your new password and OTP</p>
                      </div>
                      <form onSubmit={handleResetPassword} className="space-y-6">
                        <div className="relative group">
                          <input
                            type={showNewPassword ? "text" : "password"}
                            value={resetData.newPassword}
                            onChange={(e) => setResetData({ ...resetData, newPassword: e.target.value })}
                            placeholder="New Password"
                            className="w-full px-6 py-4 pl-14 pr-14 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-amber-500 transition-all duration-300 bg-white/80 backdrop-blur-sm group-hover:bg-white"
                            required
                          />
                          <FaLock className="absolute left-5 top-1/2 -translate-y-1/2 text-amber-500 text-xl" />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-amber-600 transition-colors duration-200"
                          >
                            {showNewPassword ? <FaEyeSlash className="text-xl" /> : <FaEye className="text-xl" />}
                          </button>
                        </div>
                        <div className="relative group">
                          <input
                            type="text"
                            value={resetData.otp}
                            onChange={(e) => setResetData({ ...resetData, otp: e.target.value })}
                            placeholder="Enter OTP"
                            className="w-full px-6 py-4 pl-14 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-amber-500 transition-all duration-300 bg-white/80 backdrop-blur-sm group-hover:bg-white"
                            required
                          />
                          <FaShieldAlt className="absolute left-5 top-1/2 -translate-y-1/2 text-amber-500 text-xl" />
                        </div>
                        <button
                          type="submit"
                          className="w-full py-4 bg-gradient-to-r from-amber-600 to-orange-600 text-white font-bold rounded-2xl hover:from-amber-700 hover:to-orange-700 transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl text-lg"
                        >
                          Reset Password
                        </button>
                      </form>
                    </div>
                  ) : showForgotPasswordForm ? (
                    <div className="space-y-6 animate-fadeIn">
                      <div className="text-center">
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-amber-600 to-orange-600 rounded-full mb-6 shadow-lg">
                          <FaEnvelope className="text-3xl text-white" />
                        </div>
                        <h2 className="text-3xl font-bold text-gray-800 mb-3">Forgot Password?</h2>
                        <p className="text-gray-600 text-lg">Enter your email to receive a reset code</p>
                      </div>
                      <form onSubmit={handleForgotPassword} className="space-y-6">
                        <div className="relative group">
                          <input
                            type="email"
                            value={forgotPasswordEmail}
                            onChange={(e) => setForgotPasswordEmail(e.target.value)}
                            placeholder="Enter your email"
                            className="w-full px-6 py-4 pl-14 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-amber-500 transition-all duration-300 bg-white/80 backdrop-blur-sm group-hover:bg-white"
                            required
                          />
                          <FaEnvelope className="absolute left-5 top-1/2 -translate-y-1/2 text-amber-500 text-xl" />
                        </div>
                        <button
                          type="submit"
                          className="w-full py-4 bg-gradient-to-r from-amber-600 to-orange-600 text-white font-bold rounded-2xl hover:from-amber-700 hover:to-orange-700 transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl text-lg"
                        >
                          Send OTP
                        </button>
                      </form>
                    </div>
                  ) : activeTab === "signup" ? (
                    <form onSubmit={handleSignUp} className="space-y-6 animate-fadeIn">
                      <div className="relative group">
                        <input
                          type="text"
                          name="fullName"
                          value={formData.fullName}
                          onChange={handleInputChange}
                          placeholder="Full Name"
                          className="w-full px-6 py-4 pl-14 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-amber-500 transition-all duration-300 bg-white/80 backdrop-blur-sm group-hover:bg-white"
                          required
                        />
                        <FaUser className="absolute left-5 top-1/2 -translate-y-1/2 text-amber-500 text-xl" />
                      </div>

                      <div className="relative group">
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          placeholder="Email Address"
                          className="w-full px-6 py-4 pl-14 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-amber-500 transition-all duration-300 bg-white/80 backdrop-blur-sm group-hover:bg-white"
                          required
                        />
                        <FaEnvelope className="absolute left-5 top-1/2 -translate-y-1/2 text-amber-500 text-xl" />
                      </div>

                      <div className="relative group">
                        <select
                          name="city"
                          value={formData.city}
                          onChange={handleInputChange}
                          className="w-full px-6 py-4 pl-14 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-amber-500 transition-all duration-300 bg-white/80 backdrop-blur-sm group-hover:bg-white appearance-none"
                          required
                        >
                          <option value="">Select City</option>
                          <option value="Kathmandu">Kathmandu</option>
                          <option value="Lalitpur">Lalitpur</option>
                        </select>
                        <FaMapMarkerAlt className="absolute left-5 top-1/2 -translate-y-1/2 text-amber-500 text-xl" />
                      </div>

                      <div className="relative group">
                        <input
                          type={showPassword ? "text" : "password"}
                          name="password"
                          value={formData.password}
                          onChange={handleInputChange}
                          placeholder="Password"
                          className="w-full px-6 py-4 pl-14 pr-14 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-amber-500 transition-all duration-300 bg-white/80 backdrop-blur-sm group-hover:bg-white"
                          required
                        />
                        <FaLock className="absolute left-5 top-1/2 -translate-y-1/2 text-amber-500 text-xl" />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-amber-600 transition-colors duration-200"
                        >
                          {showPassword ? <FaEyeSlash className="text-xl" /> : <FaEye className="text-xl" />}
                        </button>
                      </div>

                      {/* Password Strength Indicator */}
                      {formData.password && (
                        <PasswordStrengthIndicator password={formData.password} />
                      )}

                      <div className="relative group">
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleInputChange}
                          placeholder="Confirm Password"
                          className="w-full px-6 py-4 pl-14 pr-14 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-amber-500 transition-all duration-300 bg-white/80 backdrop-blur-sm group-hover:bg-white"
                          required
                        />
                        <FaLock className="absolute left-5 top-1/2 -translate-y-1/2 text-amber-500 text-xl" />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-amber-600 transition-colors duration-200"
                        >
                          {showConfirmPassword ? <FaEyeSlash className="text-xl" /> : <FaEye className="text-xl" />}
                        </button>
                      </div>

                      <div className="relative group">
                        <input
                          type="text"
                          name="phoneNumber"
                          value={formData.phoneNumber}
                          onChange={handleInputChange}
                          placeholder="Phone Number"
                          className="w-full px-6 py-4 pl-14 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-amber-500 transition-all duration-300 bg-white/80 backdrop-blur-sm group-hover:bg-white"
                          required
                        />
                        <FaPhone className="absolute left-5 top-1/2 -translate-y-1/2 text-amber-500 text-xl" />
                      </div>

                      {/* CAPTCHA Section */}
                      {captchaRequired && (
                        <div className="space-y-4">
                          <div className="text-center">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Security Verification
                            </label>
                            <div className="flex items-center justify-center space-x-3">
                              <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-2xl text-center font-mono text-2xl font-bold tracking-wider text-amber-700 shadow-lg">
                                {captchaImage}
                              </div>
                              <button
                                type="button"
                                onClick={() => setCaptchaImage(generateCaptcha())}
                                className="p-3 bg-amber-100 hover:bg-amber-200 rounded-2xl transition-colors duration-200 text-amber-600 hover:text-amber-700"
                              >
                                <FaShieldAlt className="text-xl" />
                              </button>
                            </div>
                          </div>
                          <div className="relative group">
                            <input
                              type="text"
                              placeholder="Enter the code above"
                              value={captchaValue}
                              onChange={(e) => setCaptchaValue(e.target.value)}
                              className="w-full px-6 py-4 pl-14 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-amber-500 transition-all duration-300 bg-white/80 backdrop-blur-sm group-hover:bg-white"
                              required={captchaRequired}
                            />
                            <FaShieldAlt className="absolute left-5 top-1/2 -translate-y-1/2 text-amber-500 text-xl" />
                          </div>
                        </div>
                      )}

                      <button
                        type="submit"
                        className="w-full py-4 bg-gradient-to-r from-amber-600 to-orange-600 text-white font-bold rounded-2xl hover:from-amber-700 hover:to-orange-700 transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl text-lg"
                        disabled={signUpMutation.isLoading || !passwordValidation.isValid}
                      >
                        {signUpMutation.isLoading ? "Creating Account..." : "Create Account"}
                      </button>
                    </form>
                  ) : (
                    <form onSubmit={showOtpField ? handleLoginOtp : handleLogin} className="space-y-6 animate-fadeIn">
                      <div className="relative group">
                        <input
                          type="email"
                          name="email"
                          value={loginData.email}
                          onChange={handleLoginChange}
                          placeholder="Email Address"
                          className="w-full px-6 py-4 pl-14 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-amber-500 transition-all duration-300 bg-white/80 backdrop-blur-sm group-hover:bg-white"
                          required
                        />
                        <FaEnvelope className="absolute left-5 top-1/2 -translate-y-1/2 text-amber-500 text-xl" />
                      </div>

                      <div className="relative group">
                        <input
                          type={showLoginPassword ? "text" : "password"}
                          name="password"
                          value={loginData.password}
                          onChange={handleLoginChange}
                          placeholder="Password"
                          className="w-full px-6 py-4 pl-14 pr-14 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-amber-500 transition-all duration-300 bg-white/80 backdrop-blur-sm group-hover:bg-white"
                          required
                        />
                        <FaLock className="absolute left-5 top-1/2 -translate-y-1/2 text-amber-500 text-xl" />
                        <button
                          type="button"
                          onClick={() => setShowLoginPassword(!showLoginPassword)}
                          className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-amber-600 transition-colors duration-200"
                        >
                          {showLoginPassword ? <FaEyeSlash className="text-xl" /> : <FaEye className="text-xl" />}
                        </button>
                      </div>

                      {/* 2FA OTP Field for Login */}
                      {showOtpField && activeTab !== "signup" && (
                        <div className="relative group">
                          <input
                            type="text"
                            value={otp}
                            onChange={(e) => {
                              const value = e.target.value;
                              console.log("🔐 OTP Input Change:", {
                                value: value,
                                length: value.length,
                                charCodes: value.split('').map(c => c.charCodeAt(0))
                              });
                              setOtp(value);
                            }}
                            placeholder="Enter 6-character OTP"
                            className="w-full px-6 py-4 pl-14 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-amber-500 transition-all duration-300 bg-white/80 backdrop-blur-sm group-hover:bg-white"
                            required
                            maxLength={6}
                            pattern="[A-Za-z0-9]*"
                            inputMode="text"
                          />
                          <FaShieldAlt className="absolute left-5 top-1/2 -translate-y-1/2 text-amber-500 text-xl" />
                        </div>
                      )}

                      <div className="flex justify-between items-center">
                        <label className="flex items-center text-sm text-gray-600">
                          <input
                            type="checkbox"
                            name="rememberMe"
                            checked={loginData.rememberMe}
                            onChange={handleLoginChange}
                            className="mr-3 rounded border-gray-300 text-amber-600 focus:ring-amber-500 w-4 h-4"
                          />
                          Remember Me
                        </label>
                        <button
                          type="button"
                          className="text-sm text-amber-600 hover:text-amber-700 font-bold transition-colors duration-200"
                          onClick={() => setShowForgotPasswordForm(true)}
                        >
                          Forgot Password?
                        </button>
                      </div>

                      <button
                        type="submit"
                        className={`w-full py-4 font-bold rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl text-lg ${isRateLimited
                          ? 'bg-gray-400 cursor-not-allowed'
                          : 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700'
                          }`}
                        disabled={showOtpField ? loginOtpMutation.isLoading : loginMutation.isLoading || isRateLimited}
                      >
                        {isRateLimited
                          ? `Rate Limited (${rateLimitCountdown}s)`
                          : showOtpField
                            ? (loginOtpMutation.isLoading ? "Verifying OTP..." : "Verify OTP")
                            : (loginMutation.isLoading ? "Signing In..." : "Sign In")
                        }
                      </button>


                    </form>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
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
}

export default Register;