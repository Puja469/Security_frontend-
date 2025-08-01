import { useEffect, useState } from "react";
import {
  FaCalendarAlt,
  FaCamera,
  FaCheckCircle,
  FaClock,
  FaCrown,
  FaEdit,
  FaEnvelope,
  FaExclamationTriangle,
  FaEye,
  FaEyeSlash,
  FaFingerprint,
  FaHistory,
  FaKey,
  FaLock,
  FaMapMarkerAlt,
  FaPhone,
  FaSave,
  FaShieldAlt,
  FaStar,
  FaTimes,
  FaUpload,
  FaUser,
  FaUserShield
} from "react-icons/fa";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { changePassword, fetchUserDetails, updateUser } from "../../../../services/apiServices";

// Security utilities
const SecurityUtils = {
  // Password strength validation
  validatePasswordStrength: (password) => {
    const checks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      numbers: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
      noCommon: !['password', '123456', 'qwerty', 'admin'].includes(password.toLowerCase())
    };

    const score = Object.values(checks).filter(Boolean).length;
    const strength = score <= 2 ? 'weak' : score <= 4 ? 'medium' : 'strong';

    return { checks, score, strength };
  },

  // Input sanitization
  sanitizeInput: (input) => {
    if (typeof input !== 'string') return input;
    return input
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .trim();
  },

  // Rate limiting for password attempts
  rateLimiter: {
    attempts: new Map(),
    maxAttempts: 5,
    lockoutTime: 15 * 60 * 1000, // 15 minutes

    isLocked: (identifier) => {
      const userAttempts = SecurityUtils.rateLimiter.attempts.get(identifier);
      if (!userAttempts) return false;

      const timeSinceLastAttempt = Date.now() - userAttempts.lastAttempt;
      return userAttempts.count >= SecurityUtils.rateLimiter.maxAttempts &&
        timeSinceLastAttempt < SecurityUtils.rateLimiter.lockoutTime;
    },

    recordAttempt: (identifier) => {
      const userAttempts = SecurityUtils.rateLimiter.attempts.get(identifier) || { count: 0, lastAttempt: 0 };
      userAttempts.count++;
      userAttempts.lastAttempt = Date.now();
      SecurityUtils.rateLimiter.attempts.set(identifier, userAttempts);

      return {
        isLocked: SecurityUtils.rateLimiter.isLocked(identifier),
        remainingAttempts: Math.max(0, SecurityUtils.rateLimiter.maxAttempts - userAttempts.count),
        lockoutTimeRemaining: userAttempts.count >= SecurityUtils.rateLimiter.maxAttempts ?
          SecurityUtils.rateLimiter.lockoutTime - (Date.now() - userAttempts.lastAttempt) : 0
      };
    },

    clearAttempts: (identifier) => {
      SecurityUtils.rateLimiter.attempts.delete(identifier);
    }
  },

  // Audit logging
  logActivity: (action, details) => {
    const logEntry = {
      timestamp: new Date().toISOString(),
      action,
      details,
      userId: localStorage.getItem('userId'),
      userAgent: navigator.userAgent,
      ip: 'client-side' // In real app, this would come from server
    };

    console.log('🔒 Security Audit Log:', logEntry);
    // In production, this would be sent to a secure logging service
  },

  // Session validation
  validateSession: () => {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    const isLoggedIn = localStorage.getItem('isLoggedIn');

    if (!token || !userId || isLoggedIn !== 'true') {
      SecurityUtils.logActivity('session_validation_failed', { reason: 'missing_credentials' });
      return false;
    }

    // Basic token format validation
    if (token.length < 10) {
      SecurityUtils.logActivity('session_validation_failed', { reason: 'invalid_token_format' });
      return false;
    }

    return true;
  },

  // File validation
  validateFile: (file) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!allowedTypes.includes(file.type)) {
      throw new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.');
    }

    if (file.size > maxSize) {
      throw new Error('File size too large. Maximum size is 5MB.');
    }

    // Check for potential malicious content in filename
    const maliciousPatterns = /\.(exe|bat|cmd|com|pif|scr|vbs|js)$/i;
    if (maliciousPatterns.test(file.name)) {
      throw new Error('Invalid file type detected.');
    }

    return true;
  }
};

const ProfileImage = () => {
  const [editMode, setEditMode] = useState(false);
  const [passwordMode, setPasswordMode] = useState(false);
  const [securityMode, setSecurityMode] = useState(false);
  const [userDetails, setUserDetails] = useState({
    fname: "",
    email: "",
    city: "",
    image: "",
    phone: "",
    joinDate: "",
  });
  const [profileImage, setProfileImage] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, strength: 'weak' });
  const [securityLog, setSecurityLog] = useState([]);
  const [lastPasswordChange, setLastPasswordChange] = useState(null);

  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("userId");

  // Security validation on component mount
  useEffect(() => {
    if (!SecurityUtils.validateSession()) {
      toast.error("Session validation failed. Please login again.");
      window.location.href = '/register';
      return;
    }

    SecurityUtils.logActivity('profile_page_accessed', { page: 'ProfileImage' });
  }, []);

  // Fetch user details
  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log("Fetching user details...");
        const data = await fetchUserDetails(userId);
        if (!data) throw new Error("No data returned from fetchUserDetails");

        setUserDetails({
          ...data,
          joinDate: data.createdAt ? new Date(data.createdAt).toLocaleDateString() : "N/A"
        });

        // Set last password change from backend data
        if (data.passwordChangedAt) {
          setLastPasswordChange(data.passwordChangedAt);
        }

        const profileImgUrl = data.image?.startsWith("http")
          ? data.image
          : `https://localhost:3000${data.image}`;

        setProfileImage(profileImgUrl);

        SecurityUtils.logActivity('user_details_fetched', { success: true });
      } catch (error) {
        console.error("Failed to fetch user details:", error);
        toast.error("Failed to load user details.");
        SecurityUtils.logActivity('user_details_fetch_failed', { error: error.message });
      }
    };

    fetchData();
  }, [userId, token]);

  // Handle profile image upload with security validation
  const handleProfileImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      try {
        SecurityUtils.validateFile(file);
        console.log("Uploading file:", file);
        setSelectedFile(file);
        setProfileImage(URL.createObjectURL(file));
        SecurityUtils.logActivity('profile_image_uploaded', { fileName: file.name, fileSize: file.size });
      } catch (error) {
        toast.error(error.message);
        SecurityUtils.logActivity('profile_image_upload_failed', { error: error.message });
      }
    }
  };

  // Handle input change with sanitization
  const handleInputChange = (e) => {
    const sanitizedValue = SecurityUtils.sanitizeInput(e.target.value);
    setUserDetails({ ...userDetails, [e.target.name]: sanitizedValue });
  };

  // Handle password input change with strength validation
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData({ ...passwordData, [name]: value });

    if (name === 'newPassword') {
      const strength = SecurityUtils.validatePasswordStrength(value);
      setPasswordStrength(strength);
    }
  };

  // Handle form submit with security measures
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Security validation
      if (!SecurityUtils.validateSession()) {
        throw new Error("Session validation failed");
      }

      const formData = new FormData();
      formData.append("fname", SecurityUtils.sanitizeInput(userDetails.fname));
      formData.append("city", SecurityUtils.sanitizeInput(userDetails.city));
      formData.append("phone", SecurityUtils.sanitizeInput(userDetails.phone));

      if (selectedFile) {
        SecurityUtils.validateFile(selectedFile);
        console.log("Appending new profile image:", selectedFile);
        formData.append("image", selectedFile);
      } else if (userDetails.image) {
        console.log("Appending existing profile image:", userDetails.image);
        formData.append("image", userDetails.image);
      }

      console.log("Submitting update request with:", formData);

      const response = await updateUser(userId, token, formData);
      if (!response) throw new Error("No response from updateUser");

      console.log("Update response:", response);

      if (response.user) {
        setUserDetails(response.user);
        const newProfileImageUrl = response.user.image.startsWith("http")
          ? response.user.image
          : `https://localhost:3000${response.user.image}`;

        setProfileImage(`${newProfileImageUrl}?t=${new Date().getTime()}`);
        setSelectedFile(null);
        toast.success("Profile updated successfully!", { autoClose: 2000 });
        setEditMode(false);

        SecurityUtils.logActivity('profile_updated', { success: true });
      } else {
        throw new Error("Invalid response structure");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile. Please try again.");
      SecurityUtils.logActivity('profile_update_failed', { error: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle password change with security measures
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const identifier = `${userId}_password_change`;

    // Rate limiting check
    if (SecurityUtils.rateLimiter.isLocked(identifier)) {
      const remainingTime = SecurityUtils.rateLimiter.attempts.get(identifier)?.lockoutTimeRemaining || 0;
      toast.error(`Too many password change attempts. Please wait ${Math.ceil(remainingTime / 60000)} minutes.`);
      setIsLoading(false);
      return;
    }

    try {
      // Security validation
      if (!SecurityUtils.validateSession()) {
        throw new Error("Session validation failed");
      }

      if (passwordData.newPassword !== passwordData.confirmPassword) {
        const attempt = SecurityUtils.rateLimiter.recordAttempt(identifier);
        toast.error("New passwords don't match!");
        SecurityUtils.logActivity('password_change_failed', { reason: 'password_mismatch' });
        setIsLoading(false);
        return;
      }

      const strength = SecurityUtils.validatePasswordStrength(passwordData.newPassword);
      if (strength.score < 3) {
        const attempt = SecurityUtils.rateLimiter.recordAttempt(identifier);
        toast.error("Password is too weak. Please choose a stronger password.");
        SecurityUtils.logActivity('password_change_failed', { reason: 'weak_password', strength: strength.strength });
        setIsLoading(false);
        return;
      }

      // Call the real API to change password
      const passwordChangeData = {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      };

      console.log("🔐 Calling changePassword API...");
      const response = await changePassword(token, passwordChangeData);
      console.log("✅ Password change response:", response);

      // Clear rate limiting on success
      SecurityUtils.rateLimiter.clearAttempts(identifier);

      toast.success("Password changed successfully! Your new password is now active.", { autoClose: 3000 });
      setPasswordMode(false);
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      // Update last password change timestamp
      const currentTimestamp = new Date().toISOString();
      setLastPasswordChange(currentTimestamp);

      SecurityUtils.logActivity('password_changed', { success: true, strength: strength.strength });
    } catch (error) {
      console.error("Error changing password:", error);

      // Record failed attempt for rate limiting
      const attempt = SecurityUtils.rateLimiter.recordAttempt(identifier);

      // Show specific error message from API
      toast.error(error.message || "Failed to change password. Please try again.");
      SecurityUtils.logActivity('password_change_failed', {
        error: error.message,
        remainingAttempts: attempt.remainingAttempts
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate profile completion percentage
  const calculateProfileCompletion = () => {
    const fields = ['fname', 'email', 'city', 'phone', 'image'];
    const completedFields = fields.filter(field => userDetails[field] && userDetails[field].trim() !== '');
    return Math.round((completedFields.length / fields.length) * 100);
  };

  const profileCompletion = calculateProfileCompletion();

  // Generate security log entries
  const generateSecurityLog = () => {
    const logs = [
      { action: 'Profile Page Access', timestamp: new Date().toISOString(), status: 'success' },
      { action: 'Session Validation', timestamp: new Date().toISOString(), status: 'success' },
      { action: 'User Details Fetch', timestamp: new Date().toISOString(), status: 'success' },
      ...(lastPasswordChange ? [{ action: 'Password Changed', timestamp: lastPasswordChange, status: 'success' }] : []),
    ];
    return logs;
  };

  return (
    <div className="min-h-screen bg-white py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Profile Card */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-amber-600 to-orange-600 p-8 text-white text-center relative">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative z-10">
              {/* Profile Image */}
              <div className="relative inline-block">
                <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full border-4 border-white/30 overflow-hidden shadow-2xl mx-auto mb-6 group">
                  <img
                    src={profileImage || "https://via.placeholder.com/160x160?text=Profile"}
                    alt="User Profile"
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <FaCamera className="text-white text-2xl" />
                  </div>
                </div>

                {/* Edit Button Overlay */}
                <button
                  onClick={() => setEditMode(true)}
                  className="absolute -bottom-2 -right-2 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center text-amber-600 hover:bg-amber-50 transition-all duration-300 transform hover:scale-110"
                >
                  <FaEdit className="text-lg" />
                </button>
              </div>

              {/* User Info */}
              <h1 className="text-3xl sm:text-4xl font-bold mb-2">{userDetails.fname || "User Name"}</h1>
              <p className="text-amber-100 text-lg mb-4">{userDetails.email || "No email provided"}</p>

              {/* Profile Completion */}
              <div className="max-w-md mx-auto">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-amber-100">Profile Completion</span>
                  <span className="text-sm font-semibold text-white">{profileCompletion}%</span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-2">
                  <div
                    className="bg-white h-2 rounded-full transition-all duration-500"
                    style={{ width: `${profileCompletion}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Details Section */}
          <div className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Personal Information */}
              <div className="lg:col-span-2 space-y-6">
                <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                  <FaUser className="text-amber-500" />
                  Personal Information
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors duration-300">
                    <FaUser className="text-amber-500 text-lg" />
                    <div>
                      <p className="text-sm text-gray-500">Full Name</p>
                      <p className="font-semibold text-gray-800">{userDetails.fname || "Not provided"}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors duration-300">
                    <FaEnvelope className="text-amber-500 text-lg" />
                    <div>
                      <p className="text-sm text-gray-500">Email Address</p>
                      <p className="font-semibold text-gray-800">{userDetails.email || "Not provided"}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors duration-300">
                    <FaMapMarkerAlt className="text-amber-500 text-lg" />
                    <div>
                      <p className="text-sm text-gray-500">Location</p>
                      <p className="font-semibold text-gray-800">{userDetails.city || "Not provided"}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors duration-300">
                    <FaPhone className="text-amber-500 text-lg" />
                    <div>
                      <p className="text-sm text-gray-500">Phone Number</p>
                      <p className="font-semibold text-gray-800">{userDetails.phone || "Not provided"}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors duration-300">
                    <FaCalendarAlt className="text-amber-500 text-lg" />
                    <div>
                      <p className="text-sm text-gray-500">Member Since</p>
                      <p className="font-semibold text-gray-800">{userDetails.joinDate}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200">
                    <FaCrown className="text-amber-600 text-lg" />
                    <div>
                      <p className="text-sm text-amber-600">Account Status</p>
                      <p className="font-semibold text-amber-800">Active Member</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="space-y-6">
                <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                  <FaEdit className="text-amber-500" />
                  Quick Actions
                </h3>

                <div className="space-y-4">
                  <button
                    onClick={() => setEditMode(true)}
                    className="w-full p-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center gap-3"
                  >
                    <FaEdit />
                    Edit Profile
                  </button>

                  <button
                    onClick={() => setPasswordMode(true)}
                    className="w-full p-4 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center gap-3"
                  >
                    <FaLock />
                    Change Password
                  </button>

                  <button
                    onClick={() => setSecurityMode(true)}
                    className="w-full p-4 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center gap-3"
                  >
                    <FaShieldAlt />
                    Security Center
                  </button>

                  <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                    <h4 className="font-semibold text-amber-800 mb-2 flex items-center gap-2">
                      <FaCheckCircle className="text-amber-600" />
                      Profile Tips
                    </h4>
                    <ul className="text-sm text-amber-700 space-y-1">
                      <li>• Add a clear profile picture</li>
                      <li>• Keep your information up to date</li>
                      <li>• Use your real name for trust</li>
                      <li>• Complete your profile for better visibility</li>
                    </ul>
                  </div>

                  <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                    <h4 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
                      <FaStar className="text-green-600" />
                      Security Status
                    </h4>
                    <p className="text-sm text-green-700">
                      Your account is secure and protected with the latest security measures.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Edit Profile Modal */}
        {editMode && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4 z-50">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-fadeIn">
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-amber-600 to-orange-600 p-6 text-white">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold flex items-center gap-3">
                    <FaEdit />
                    Edit Profile
                  </h3>
                  <button
                    onClick={() => setEditMode(false)}
                    className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors duration-300"
                  >
                    <FaTimes />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-6">
                <form onSubmit={handleFormSubmit} className="space-y-6">
                  {/* Profile Image Upload */}
                  <div className="text-center">
                    <div className="relative inline-block">
                      <div className="w-24 h-24 rounded-full border-4 border-amber-200 overflow-hidden mx-auto mb-4">
                        <img
                          src={profileImage || "https://via.placeholder.com/96x96?text=Profile"}
                          alt="Profile Preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <label className="absolute -bottom-2 -right-2 w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center text-white cursor-pointer hover:bg-amber-600 transition-colors duration-300">
                        <FaUpload className="text-sm" />
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleProfileImageUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                    <p className="text-sm text-gray-500">Click the upload icon to change photo (Max 5MB)</p>
                  </div>

                  {/* Form Fields */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name
                      </label>
                      <input
                        type="text"
                        name="fname"
                        placeholder="Enter your full name"
                        value={userDetails.fname}
                        onChange={handleInputChange}
                        className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-300"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        City
                      </label>
                      <input
                        type="text"
                        name="city"
                        placeholder="Enter your city"
                        value={userDetails.city}
                        onChange={handleInputChange}
                        className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-300"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        placeholder="Enter your phone number"
                        value={userDetails.phone}
                        onChange={handleInputChange}
                        className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-300"
                      />
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setEditMode(false)}
                      className="flex-1 p-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all duration-300"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="flex-1 p-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Saving...
                        </>
                      ) : (
                        <>
                          <FaSave />
                          Save Changes
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Change Password Modal */}
        {passwordMode && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4 z-50">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-fadeIn">
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold flex items-center gap-3">
                    <FaLock />
                    Change Password
                  </h3>
                  <button
                    onClick={() => setPasswordMode(false)}
                    className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors duration-300"
                  >
                    <FaTimes />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-6">
                <form onSubmit={handlePasswordSubmit} className="space-y-6">
                  {/* Security Notice */}
                  <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                    <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                      <FaShieldAlt className="text-blue-600" />
                      Security Notice
                    </h4>
                    <p className="text-sm text-blue-700">
                      Choose a strong password with at least 8 characters, including letters, numbers, and symbols.
                    </p>
                  </div>

                  {/* Password Fields */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Current Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          name="currentPassword"
                          placeholder="Enter current password"
                          value={passwordData.currentPassword}
                          onChange={handlePasswordChange}
                          className="w-full p-3 pr-10 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPassword ? <FaEyeSlash /> : <FaEye />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showNewPassword ? "text" : "password"}
                          name="newPassword"
                          placeholder="Enter new password"
                          value={passwordData.newPassword}
                          onChange={handlePasswordChange}
                          className="w-full p-3 pr-10 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                        </button>
                      </div>

                      {/* Password Strength Indicator */}
                      {passwordData.newPassword && (
                        <div className="mt-2">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs text-gray-500">Strength:</span>
                            <span className={`text-xs font-semibold ${passwordStrength.strength === 'weak' ? 'text-red-500' :
                              passwordStrength.strength === 'medium' ? 'text-yellow-500' : 'text-green-500'
                              }`}>
                              {passwordStrength.strength.toUpperCase()}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1">
                            <div
                              className={`h-1 rounded-full transition-all duration-300 ${passwordStrength.strength === 'weak' ? 'bg-red-500' :
                                passwordStrength.strength === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                                }`}
                              style={{ width: `${(passwordStrength.score / 6) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Confirm New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          name="confirmPassword"
                          placeholder="Confirm new password"
                          value={passwordData.confirmPassword}
                          onChange={handlePasswordChange}
                          className="w-full p-3 pr-10 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setPasswordMode(false)}
                      className="flex-1 p-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all duration-300"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="flex-1 p-3 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Updating...
                        </>
                      ) : (
                        <>
                          <FaLock />
                          Update Password
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Security Center Modal */}
        {securityMode && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4 z-50">
            <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden animate-fadeIn">
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6 text-white">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold flex items-center gap-3">
                    <FaShieldAlt />
                    Security Center
                  </h3>
                  <button
                    onClick={() => setSecurityMode(false)}
                    className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors duration-300"
                  >
                    <FaTimes />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-6">
                <div className="space-y-6">
                  {/* Security Status */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                      <div className="flex items-center gap-3 mb-2">
                        <FaCheckCircle className="text-green-600 text-lg" />
                        <h4 className="font-semibold text-green-800">Session Status</h4>
                      </div>
                      <p className="text-sm text-green-700">Active and secure</p>
                    </div>

                    <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                      <div className="flex items-center gap-3 mb-2">
                        <FaUserShield className="text-blue-600 text-lg" />
                        <h4 className="font-semibold text-blue-800">Account Protection</h4>
                      </div>
                      <p className="text-sm text-blue-700">Enhanced security enabled</p>
                    </div>

                    <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                      <div className="flex items-center gap-3 mb-2">
                        <FaFingerprint className="text-amber-600 text-lg" />
                        <h4 className="font-semibold text-amber-800">Profile Completion</h4>
                      </div>
                      <p className="text-sm text-amber-700">{profileCompletion}% complete</p>
                    </div>

                    <div className="p-4 bg-purple-50 rounded-xl border border-purple-200">
                      <div className="flex items-center gap-3 mb-2">
                        <FaClock className="text-purple-600 text-lg" />
                        <h4 className="font-semibold text-purple-800">Last Password Change</h4>
                      </div>
                      <p className="text-sm text-purple-700">
                        {lastPasswordChange ? new Date(lastPasswordChange).toLocaleDateString() : 'Never'}
                      </p>
                    </div>
                  </div>

                  {/* Security Log */}
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <FaHistory className="text-green-600" />
                      Recent Security Activity
                    </h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {generateSecurityLog().map((log, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${log.status === 'success' ? 'bg-green-500' : 'bg-red-500'
                              }`}></div>
                            <span className="text-sm text-gray-700">{log.action}</span>
                          </div>
                          <span className="text-xs text-gray-500">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Security Tips */}
                  <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                    <h4 className="font-semibold text-yellow-800 mb-2 flex items-center gap-2">
                      <FaExclamationTriangle className="text-yellow-600" />
                      Security Tips
                    </h4>
                    <ul className="text-sm text-yellow-700 space-y-1">
                      <li>• Never share your password with anyone</li>
                      <li>• Use a unique password for each account</li>
                      <li>• Enable two-factor authentication if available</li>
                      <li>• Regularly update your password</li>
                      <li>• Be cautious of phishing attempts</li>
                    </ul>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => setPasswordMode(true)}
                      className="flex-1 p-3 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2"
                    >
                      <FaKey />
                      Change Password
                    </button>
                    <button
                      onClick={() => setSecurityMode(false)}
                      className="flex-1 p-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all duration-300"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.9) translateY(-20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default ProfileImage;
