import { useMutation, useQuery } from '@tanstack/react-query';
import React, { useEffect, useMemo, useState } from 'react';
import { FaBars, FaBell, FaHome, FaLock, FaSearch, FaShieldAlt, FaShoppingBag, FaSignOutAlt, FaTimes, FaUser, FaUserSecret } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchNotifications, fetchUserDetails, markNotificationsAsRead } from '../services/apiServices';
import socket from '../socket/socket';

function Header() {
    const navigate = useNavigate();
    const { isLoggedIn, userId, role, token, logout, isInitialized, isAuthenticated, userData } = useAuth();

    // Memoize authentication state to prevent infinite re-renders
    const authState = useMemo(() => ({
        isAuthenticated: isAuthenticated(),
        isLoggedIn,
        userId
    }), [isLoggedIn, userId]);

    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [notificationOpen, setNotificationOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [markNotificationsAvailable, setMarkNotificationsAvailable] = useState(true);

    // Get fallback user data from localStorage
    const getFallbackUserData = () => {
        if (userData) return userData;

        // Fallback to localStorage data
        const storedFname = localStorage.getItem('fname');
        const storedEmail = localStorage.getItem('email');

        if (storedFname || storedEmail) {
            return {
                fname: storedFname || 'User',
                email: storedEmail || 'user@example.com'
            };
        }

        return null;
    };

    // Debug authentication state
    useEffect(() => {
        const currentPath = window.location.pathname;
        const localStorageData = {
            fname: localStorage.getItem('fname'),
            email: localStorage.getItem('email'),
            justLoggedIn: localStorage.getItem('justLoggedIn')
        };

        console.log('🔍 Header Auth Debug:', {
            isLoggedIn,
            userId,
            hasHttpOnlyCookie: document.cookie.includes('token='),
            isAuthenticated: authState.isAuthenticated,
            currentPath,
            localStorage: localStorageData
        });
    }, [isLoggedIn, userId, authState.isAuthenticated]);

    // Fetch User Details
    const { data: user, isLoading: userLoading, error: userError } = useQuery(
        ['userDetails', userId],
        () => fetchUserDetails(userId),
        {
            enabled: authState.isAuthenticated,
            retry: 1,
            retryDelay: 3000,
            staleTime: 10 * 60 * 1000,
            cacheTime: 15 * 60 * 1000,
            onSuccess: (data) => {
                console.log("✅ User details fetched successfully:", data);
                console.log("🔍 User data structure:", {
                    hasData: !!data,
                    dataType: typeof data,
                    keys: data ? Object.keys(data) : null,
                    fname: data?.fname,
                    email: data?.email
                });
            },
            onError: (err) => {
                console.error("❌ Failed to fetch user details:", err);
                if (err.response?.status === 401) {
                    console.warn("🔒 User authentication failed, may need to re-login");
                }
            }
        }
    );

    // Debug user details query state
    useEffect(() => {
        console.log('🔍 User Details Query Debug:', {
            enabled: authState.isAuthenticated,
            userId,
            isLoading: userLoading,
            hasError: !!userError,
            hasData: !!user,
            userData: user,
            userKeys: user ? Object.keys(user) : null
        });
    }, [authState.isAuthenticated, userId, userLoading, userError, user]);

    // Fetch Notifications
    const { data: notifications = [], refetch: refetchNotifications } = useQuery(
        ['notifications', userId],
        () => fetchNotifications(userId),
        {
            enabled: authState.isAuthenticated,
            retry: 1,
            retryDelay: 3000,
            staleTime: 5 * 60 * 1000,
            cacheTime: 10 * 60 * 1000,
            onSuccess: (data) => {
                // Handle both possible property names for read status
                const unread = data.filter((n) => !n.isRead && !n.read).length;
                setUnreadCount(unread);
                console.log("✅ Notifications fetched successfully:", data.length, "notifications");
            },
            onError: (err) => {
                console.error("❌ Failed to fetch notifications:", err);
                if (err.response?.status === 401) {
                    console.warn("🔒 User authentication failed for notifications");
                }
            }
        }
    );

    // Mark Notifications as Read Mutation
    const markAsReadMutation = useMutation(() => markNotificationsAsRead(userId), {
        onSuccess: (data) => {
            if (data?.success !== false) {
                setUnreadCount(0);
                refetchNotifications();
            }
        },
        onError: (error) => {
            if (error.response?.status === 404) {
                console.warn("⚠️ Mark notifications as read endpoint not available");
                setMarkNotificationsAvailable(false);
            }
        }
    });

    // Calculate unread notifications count
    useEffect(() => {
        if (notifications && userId) {
            // Handle both possible property names for read status and be more flexible with notification structure
            const unread = notifications.filter(n => {
                const isUnread = !n.isRead && !n.read;
                const isRelevant = !n.buyerId || n.buyerId === userId;
                const isStatusUpdate = !n.type || n.type === 'status_update';
                return isUnread && isRelevant && isStatusUpdate;
            }).length;
            setUnreadCount(unread);
        }
    }, [notifications, userId]);

    // Socket connection for real-time notifications
    useEffect(() => {
        if (authState.isAuthenticated) {
            socket.emit("joinRoom", userId);

            socket.on("notification", () => {
                refetchNotifications();
                setUnreadCount((prev) => prev + 1);
            });

            return () => {
                socket.off("notification");
            };
        }
    }, [authState.isAuthenticated, userId]);

    const handleLogout = () => {
        logout();
        navigate("/register");
    };

    const toggleNotificationDropdown = () => {
        setNotificationOpen((prev) => !prev);
        if (!notificationOpen && authState.isLoggedIn && authState.userId && markNotificationsAvailable) {
            markAsReadMutation.mutate();
        }
    };

    const markNotificationAsRead = (notificationId) => {
        if (authState.isLoggedIn && authState.userId) {
            // For now, just refetch notifications since the API might not support individual marking
            // TODO: Implement individual notification marking if the backend supports it
            refetchNotifications();
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim() !== "") {
            navigate(`/?query=${encodeURIComponent(searchQuery)}`);
            setSearchQuery("");
        }
    };

    const toggleMobileMenu = () => {
        setMobileMenuOpen((prev) => !prev);
    };

    // Inline SVG for user profile fallback
    const userProfileSvg = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23f59e0b'%3E%3Cpath d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/%3E%3C/svg%3E";

    return (
        <header className="fixed top-0 left-0 w-full bg-white/95 backdrop-blur-xl border-b border-gray-200/50 text-gray-900 shadow-lg py-3 px-6 z-50 h-20 flex items-center">
            <div className="flex items-center justify-between w-full max-w-7xl mx-auto">
                {/* Left: Logo and Mobile Menu Toggle */}
                <div className="flex items-center space-x-6">
                    {/* Mobile Menu Toggle Button */}
                    <button
                        className="lg:hidden p-2 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100 text-amber-600 hover:text-amber-700 transition-all duration-300"
                        onClick={toggleMobileMenu}
                    >
                        {mobileMenuOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
                    </button>

                    {/* Logo and Brand */}
                    <div className="flex items-center space-x-4">
                        <img
                            src="/assets/images/logo.png"
                            alt="Thrift Store Logo"
                            className="h-16 w-auto object-contain hover:scale-105 transition-transform duration-300"
                        />
                        <div className="hidden md:block">
                            <h1 className="text-2xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                                Thrift Store
                            </h1>
                            <p className="text-sm text-gray-500 font-medium">Sustainable Shopping</p>
                        </div>
                    </div>
                </div>

                {/* Middle: Search Bar (Visible on larger screens) */}
                <div className="hidden lg:flex flex-grow mx-8 max-w-2xl">
                    <form onSubmit={handleSearch} className="relative w-full">
                        <div className={`relative transition-all duration-300 ${isSearchFocused ? 'scale-105' : ''}`}>
                            <input
                                type="text"
                                placeholder="Search for amazing deals..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onFocus={() => setIsSearchFocused(true)}
                                onBlur={() => setIsSearchFocused(false)}
                                className="w-full px-6 py-3 pl-12 pr-20 bg-white/80 backdrop-blur-sm border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-amber-500 focus:bg-white transition-all duration-300 shadow-sm hover:shadow-md"
                            />
                            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <button
                                type="submit"
                                className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-xl hover:from-amber-700 hover:to-orange-700 focus:outline-none transition-all duration-300 text-sm font-semibold"
                            >
                                Search
                            </button>
                        </div>
                    </form>
                </div>

                {/* Right: User Options (Visible on larger screens) */}
                <div className="hidden lg:flex items-center space-x-6">
                    {/* Navigation Links */}
                    <nav className="flex items-center space-x-4 mr-4">
                        <button
                            onClick={() => navigate("/")}
                            className="flex items-center space-x-2 px-4 py-2 rounded-xl hover:bg-gradient-to-r hover:from-amber-50 hover:to-orange-50 text-gray-700 hover:text-amber-600 transition-all duration-300"
                        >
                            <FaHome size={16} />
                            <span className="font-medium">Home</span>
                        </button>
                        <button
                            onClick={() => navigate("/category")}
                            className="flex items-center space-x-2 px-4 py-2 rounded-xl hover:bg-gradient-to-r hover:from-amber-50 hover:to-orange-50 text-gray-700 hover:text-amber-600 transition-all duration-300"
                        >
                            <FaShoppingBag size={16} />
                            <span className="font-medium">Categories</span>
                        </button>
                    </nav>

                    {/* Notifications Icon */}
                    <div className="relative">
                        <button
                            className="relative p-3 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100 text-amber-600 hover:text-amber-700 transition-all duration-300 group"
                            onClick={toggleNotificationDropdown}
                        >
                            <FaBell size={18} className="group-hover:scale-110 transition-transform" />
                            {unreadCount > 0 && (
                                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center font-bold animate-pulse">
                                    {unreadCount > 9 ? '9+' : unreadCount}
                                </span>
                            )}
                        </button>
                        {notificationOpen && (
                            <div className="absolute right-0 mt-3 w-80 bg-white/95 backdrop-blur-xl shadow-2xl rounded-2xl overflow-hidden border border-gray-200/50 z-20">
                                <div className="p-4 border-b border-gray-200/50">
                                    <h4 className="text-lg font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                                        Notifications
                                    </h4>
                                </div>
                                <ul className="max-h-64 overflow-y-auto">
                                    {notifications && Array.isArray(notifications) && notifications.length > 0 ? (
                                        notifications.map((notification, index) => (
                                            <li
                                                key={index}
                                                className={`p-4 border-b border-gray-200/50 last:border-none hover:bg-gray-50/50 transition-colors duration-200 ${(notification.isRead || notification.read) ? "opacity-60" : "bg-amber-50/30"
                                                    }`}
                                            >
                                                <p
                                                    className="text-sm text-gray-700 leading-relaxed"
                                                    dangerouslySetInnerHTML={{
                                                        __html: (notification.message || 'No message').replace(
                                                            /(http:\/\/[^\s]+)/g,
                                                            '<a href="$1" class="text-amber-600 hover:text-amber-700 underline font-medium" target="_blank" rel="noopener noreferrer">$1</a>'
                                                        ),
                                                    }}
                                                />
                                                {notification.link && (
                                                    <a
                                                        href={notification.link}
                                                        className="mt-2 inline-block text-sm text-amber-600 hover:text-amber-700 font-semibold underline"
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                    >
                                                        View Details →
                                                    </a>
                                                )}
                                            </li>
                                        ))
                                    ) : (
                                        <li className="p-8 text-center">
                                            <FaBell className="mx-auto text-gray-300 mb-3" size={32} />
                                            <p className="text-gray-500">No notifications yet.</p>
                                        </li>
                                    )}
                                </ul>
                            </div>
                        )}
                    </div>

                    {/* User Profile or Login */}
                    {authState.isLoggedIn && authState.userId ? (
                        (user || getFallbackUserData()) ? (
                            <div className="relative">
                                <div
                                    className="flex items-center space-x-3 p-2 rounded-xl hover:bg-gradient-to-r hover:from-amber-50 hover:to-orange-50 cursor-pointer transition-all duration-300"
                                    onClick={() => setDropdownOpen((prev) => !prev)}
                                >
                                    <div className="relative">
                                        <img
                                            src={
                                                (user || getFallbackUserData())?.image
                                                    ? `https://localhost:3000${(user || getFallbackUserData()).image}`
                                                    : userProfileSvg
                                            }
                                            alt={(user || getFallbackUserData())?.fname || "User"}
                                            className="h-10 w-10 rounded-full border-2 border-amber-200 hover:border-amber-400 transition-colors duration-300"
                                            onError={(e) => {
                                                e.target.src = userProfileSvg;
                                            }}
                                        />
                                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                                    </div>
                                    <div className="hidden xl:block">
                                        <p className="text-sm font-semibold text-gray-800">{(user || getFallbackUserData())?.fname || "User"}</p>
                                        <p className="text-xs text-gray-500">
                                            {user ? "Welcome back!" : "Offline mode"}
                                        </p>
                                    </div>
                                </div>
                                {dropdownOpen && (
                                    <div className="absolute top-full mt-2 right-0 w-56 bg-white/95 backdrop-blur-xl shadow-2xl rounded-2xl overflow-hidden border border-gray-200/50 z-20">
                                        <div className="p-4 border-b border-gray-200/50">
                                            <p className="font-semibold text-gray-800">{(user || getFallbackUserData())?.fname || "User"}</p>
                                            <p className="text-sm text-gray-500">{(user || getFallbackUserData())?.email || "Loading..."}</p>
                                            {!user && getFallbackUserData() && (
                                                <p className="text-xs text-amber-600 mt-1">
                                                    Using cached data
                                                </p>
                                            )}
                                        </div>
                                        <div className="p-2">
                                            <button
                                                className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gradient-to-r hover:from-amber-50 hover:to-orange-50 rounded-xl flex items-center space-x-3 transition-all duration-300"
                                                onClick={() => navigate("/my-account")}
                                            >
                                                <FaUser className="text-amber-600" size={16} />
                                                <span>My Account</span>
                                            </button>
                                            <button
                                                className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gradient-to-r hover:from-amber-50 hover:to-orange-50 rounded-xl flex items-center space-x-3 transition-all duration-300"
                                                onClick={() => navigate("/security")}
                                            >
                                                <FaShieldAlt className="text-amber-600" size={16} />
                                                <span>Security Dashboard</span>
                                            </button>
                                            <button
                                                className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gradient-to-r hover:from-amber-50 hover:to-orange-50 rounded-xl flex items-center space-x-3 transition-all duration-300"
                                                onClick={() => navigate("/privacy")}
                                            >
                                                <FaUserSecret className="text-amber-600" size={16} />
                                                <span>Privacy Settings</span>
                                            </button>
                                            <button
                                                className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gradient-to-r hover:from-amber-50 hover:to-orange-50 rounded-xl flex items-center space-x-3 transition-all duration-300"
                                                onClick={() => navigate("/security-audit")}
                                            >
                                                <FaLock className="text-amber-600" size={16} />
                                                <span>Security Audit</span>
                                            </button>
                                            <button
                                                className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gradient-to-r hover:from-amber-50 hover:to-orange-50 rounded-xl flex items-center space-x-3 transition-all duration-300"
                                                onClick={handleLogout}
                                            >
                                                <FaSignOutAlt className="text-red-500" size={16} />
                                                <span>Logout</span>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            // Loading state while fetching user data
                            <div className="flex items-center space-x-3 p-2 rounded-xl">
                                <div className="h-10 w-10 rounded-full border-2 border-amber-200 bg-gray-200 animate-pulse"></div>
                                <div className="hidden xl:block">
                                    <div className="h-4 w-20 bg-gray-200 rounded animate-pulse mb-1"></div>
                                    <div className="h-3 w-16 bg-gray-200 rounded animate-pulse"></div>
                                </div>
                            </div>
                        )
                    ) : (
                        <button
                            className="px-6 py-3 bg-gradient-to-r from-amber-600 to-orange-600 text-white font-semibold rounded-xl hover:from-amber-700 hover:to-orange-700 focus:outline-none transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                            onClick={() => navigate("/register")}
                        >
                            Login/Signup
                        </button>
                    )}
                </div>

                {/* Mobile Menu (Visible on smaller screens) */}
                {mobileMenuOpen && (
                    <div className="lg:hidden absolute top-20 left-0 w-full bg-white/95 backdrop-blur-xl shadow-2xl border-b border-gray-200/50 py-6 px-4 z-20">
                        {/* Search Bar for Mobile */}
                        <form onSubmit={handleSearch} className="mb-6">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Search for amazing deals..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full px-4 py-3 pl-12 pr-20 bg-white/80 backdrop-blur-sm border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-amber-500 focus:bg-white transition-all duration-300"
                                />
                                <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                <button
                                    type="submit"
                                    className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-xl hover:from-amber-700 hover:to-orange-700 transition-all duration-300 text-sm font-semibold"
                                >
                                    Search
                                </button>
                            </div>
                        </form>

                        {/* Navigation Links for Mobile */}
                        <div className="mb-6 space-y-2">
                            <button
                                onClick={() => navigate("/")}
                                className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl hover:bg-gradient-to-r hover:from-amber-50 hover:to-orange-50 text-gray-700 hover:text-amber-600 transition-all duration-300"
                            >
                                <FaHome size={18} />
                                <span className="font-medium">Home</span>
                            </button>
                            <button
                                onClick={() => navigate("/category")}
                                className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl hover:bg-gradient-to-r hover:from-amber-50 hover:to-orange-50 text-gray-700 hover:text-amber-600 transition-all duration-300"
                            >
                                <FaShoppingBag size={18} />
                                <span className="font-medium">Categories</span>
                            </button>
                        </div>

                        {/* Notifications for Mobile */}
                        <div className="mb-6">
                            <button
                                className="w-full flex items-center justify-between px-4 py-3 rounded-xl hover:bg-gradient-to-r hover:from-amber-50 hover:to-orange-50 text-gray-700 hover:text-amber-600 transition-all duration-300"
                                onClick={toggleNotificationDropdown}
                            >
                                <div className="flex items-center space-x-3">
                                    <FaBell size={18} />
                                    <span className="font-medium">Notifications</span>
                                </div>
                                {unreadCount > 0 && (
                                    <span className="w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center font-bold">
                                        {unreadCount > 9 ? '9+' : unreadCount}
                                    </span>
                                )}
                            </button>
                            {notificationOpen && (
                                <div className="mt-3 bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50">
                                    <h4 className="text-sm font-bold mb-3 text-amber-600">Recent Notifications</h4>
                                    <ul className="space-y-2 max-h-48 overflow-y-auto">
                                        {notifications && Array.isArray(notifications) && notifications.length > 0 ? (
                                            notifications.map((notification, index) => (
                                                <li
                                                    key={index}
                                                    className={`text-sm p-3 rounded-lg ${(notification.isRead || notification.read) ? "bg-gray-50/50 text-gray-500" : "bg-amber-50/50 text-gray-700"
                                                        }`}
                                                >
                                                    {notification.message || 'No message'}
                                                </li>
                                            ))
                                        ) : (
                                            <li className="text-sm text-gray-500 text-center py-4">
                                                <FaBell className="mx-auto text-gray-300 mb-2" size={24} />
                                                No notifications yet
                                            </li>
                                        )}
                                    </ul>
                                </div>
                            )}
                        </div>

                        {/* User Profile or Login for Mobile */}
                        {authState.isLoggedIn && authState.userId ? (
                            user ? (
                                <div className="space-y-2">
                                    <div className="flex items-center space-x-3 px-4 py-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl">
                                        <img
                                            src={
                                                user?.image
                                                    ? `http://localhost:3000${user.image}`
                                                    : userProfileSvg
                                            }
                                            alt={user?.fname || "User"}
                                            className="h-10 w-10 rounded-full border-2 border-amber-200"
                                            onError={(e) => {
                                                e.target.src = userProfileSvg;
                                            }}
                                        />
                                        <div>
                                            <p className="font-semibold text-gray-800">{user?.fname || "User"}</p>
                                            <p className="text-sm text-gray-500">Welcome back!</p>
                                        </div>
                                    </div>
                                    <button
                                        className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl hover:bg-gradient-to-r hover:from-amber-50 hover:to-orange-50 text-gray-700 hover:text-amber-600 transition-all duration-300"
                                        onClick={() => navigate("/my-account")}
                                    >
                                        <FaUser size={18} />
                                        <span className="font-medium">My Account</span>
                                    </button>
                                    <button
                                        className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl hover:bg-gradient-to-r hover:from-amber-50 hover:to-orange-50 text-gray-700 hover:text-amber-600 transition-all duration-300"
                                        onClick={() => navigate("/security")}
                                    >
                                        <FaShieldAlt size={18} />
                                        <span className="font-medium">Security Dashboard</span>
                                    </button>
                                    <button
                                        className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl hover:bg-gradient-to-r hover:from-amber-50 hover:to-orange-50 text-gray-700 hover:text-amber-600 transition-all duration-300"
                                        onClick={() => navigate("/privacy")}
                                    >
                                        <FaUserSecret size={18} />
                                        <span className="font-medium">Privacy Settings</span>
                                    </button>
                                    <button
                                        className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl hover:bg-gradient-to-r hover:from-amber-50 hover:to-orange-50 text-gray-700 hover:text-amber-600 transition-all duration-300"
                                        onClick={() => navigate("/security-audit")}
                                    >
                                        <FaLock size={18} />
                                        <span className="font-medium">Security Audit</span>
                                    </button>
                                    <button
                                        className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl hover:bg-gradient-to-r hover:from-amber-50 hover:to-orange-50 text-red-600 hover:text-red-700 transition-all duration-300"
                                        onClick={handleLogout}
                                    >
                                        <FaSignOutAlt size={18} />
                                        <span className="font-medium">Logout</span>
                                    </button>
                                </div>
                            ) : (
                                // Loading state while fetching user data
                                <div className="flex items-center space-x-3 px-4 py-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl">
                                    <div className="h-10 w-10 rounded-full border-2 border-amber-200 bg-gray-200 animate-pulse"></div>
                                    <div>
                                        <div className="h-4 w-20 bg-gray-200 rounded animate-pulse mb-1"></div>
                                        <div className="h-3 w-16 bg-gray-200 rounded animate-pulse"></div>
                                    </div>
                                </div>
                            )
                        ) : (
                            <button
                                className="w-full px-6 py-3 bg-gradient-to-r from-amber-600 to-orange-600 text-white font-semibold rounded-xl hover:from-amber-700 hover:to-orange-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
                                onClick={() => navigate("/register")}
                            >
                                Login/Signup
                            </button>
                        )}
                    </div>
                )}
            </div>
        </header>
    );
}

export default Header;
