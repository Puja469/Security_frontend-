import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useEffect, useMemo, useState } from "react";
import Banner from "../../../../components/Banner";
import Header from "../../../../components/header";
import { useAuth } from "../../../../context/AuthContext";
import socket from "../../../../socket/socket";

import {
  FaBox,
  FaChartLine,
  FaCheck,
  FaCheckCircle,
  FaClock,
  FaCog,
  FaDollarSign,
  FaEdit,
  FaEye,
  FaHeart,
  FaImage,
  FaList,
  FaPlus,
  FaSearch,
  FaShare,
  FaShoppingCart,
  FaSort,
  FaStar,
  FaTimes,
  FaTrash,
  FaUsers
} from "react-icons/fa";
import { toast } from "react-toastify";
import { useNotification } from "../../../../context/NotificationContext";
import {
  addProduct,
  deleteProduct,
  fetchCategories,
  fetchMyOrders,
  fetchProducts,
  fetchSoldItems,
  fetchUserDetails,
  updateOrderStatus,
  updateProductStatus,
} from "../../../../services/apiServices";
import ProfileImage from "./ProfileImage";
import Form from "./form";

const MyAccount = () => {
  const { userId: authUserId, isAuthenticated } = useAuth();

  // Memoize authentication state to prevent infinite re-renders
  const authState = useMemo(() => ({
    isAuthenticated: isAuthenticated(),
    userId: authUserId
  }), [isAuthenticated, authUserId]);

  const { notifications, setNotifications } = useNotification();
  const queryClient = useQueryClient();
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [activeTab, setActiveTab] = useState("Pending");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const [viewMode, setViewMode] = useState("grid"); // grid or list
  const [isLoading, setIsLoading] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [showBulkActions, setShowBulkActions] = useState(false);

  // Local state for temporary status updates
  const [localStatusUpdates, setLocalStatusUpdates] = useState({});

  // Real-time status updates from socket
  const [realTimeStatusUpdates, setRealTimeStatusUpdates] = useState({});

  // Notification system for status updates
  const [statusNotifications, setStatusNotifications] = useState([]);

  // Load notifications from localStorage
  useEffect(() => {
    const savedNotifications = localStorage.getItem('statusNotifications');
    if (savedNotifications) {
      try {
        const parsed = JSON.parse(savedNotifications);
        setStatusNotifications(parsed);
      } catch (error) {
        console.error('Error loading notifications:', error);
      }
    }
  }, []);

  // Save notifications to localStorage
  const saveNotification = (notification) => {
    const newNotifications = [notification, ...statusNotifications];
    setStatusNotifications(newNotifications);
    localStorage.setItem('statusNotifications', JSON.stringify(newNotifications));
  };

  // Clear notification
  const clearNotification = (notificationId) => {
    const newNotifications = statusNotifications.filter(n => n.id !== notificationId);
    setStatusNotifications(newNotifications);
    localStorage.setItem('statusNotifications', JSON.stringify(newNotifications));
  };

  // Real-time status updates are now handled by socket server
  // No need to check localStorage for status changes

  // Listen for real-time notifications from socket server
  useEffect(() => {
    if (!authUserId) return;

    // Listen for order status update notifications
    const handleStatusUpdateNotification = (data) => {
      console.log("🔔 Real-time status update notification received:", data);

      const { orderId, newStatus, updatedBy, itemName, buyerId } = data;

      // Only show notification if this user is the buyer
      if (buyerId === authUserId) {
        toast.info(`Your order "${itemName}" status has been updated to ${newStatus} by ${updatedBy}!`, {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      }
    };

    // Listen for general notifications
    const handleGeneralNotification = (data) => {
      console.log("🔔 General notification received:", data);

      if (data.type === 'status_update' && data.buyerId === authUserId) {
        toast.info(data.message, {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      }
    };

    // Join user's room for notifications
    socket.emit("joinRoom", authUserId);

    // Listen for status update notifications
    socket.on("orderStatusUpdated", handleStatusUpdateNotification);
    socket.on("notification", handleGeneralNotification);

    return () => {
      socket.off("orderStatusUpdated", handleStatusUpdateNotification);
      socket.off("notification", handleGeneralNotification);
      socket.emit("leaveRoom", authUserId);
    };
  }, [authUserId]);

  // Load local status updates from localStorage on mount
  useEffect(() => {
    const savedUpdates = localStorage.getItem('localOrderStatusUpdates');
    if (savedUpdates) {
      try {
        setLocalStatusUpdates(JSON.parse(savedUpdates));
      } catch (error) {
        console.log('Error loading local status updates:', error);
      }
    }
  }, []);

  // Socket listeners for real-time status updates
  useEffect(() => {
    if (!authUserId) return;

    // Listen for order status updates
    const handleOrderStatusUpdate = (data) => {
      console.log("🔔 Real-time order status update received:", data);

      const { orderId, newStatus, updatedBy, orderDetails } = data;

      // Update real-time status
      setRealTimeStatusUpdates(prev => ({
        ...prev,
        [orderId]: {
          status: newStatus,
          updatedBy,
          timestamp: new Date().toISOString(),
          orderDetails
        }
      }));

      // Show notification
      toast.success(`Order status updated to ${newStatus}!`, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });

      // Invalidate queries to refresh data
      queryClient.invalidateQueries(["myOrders", authUserId]);
      queryClient.invalidateQueries(["soldItems", authUserId]);
    };

    // Listen for order status changes
    socket.on("orderStatusUpdated", handleOrderStatusUpdate);

    // Join user's room for real-time updates
    socket.emit("joinUserRoom", authUserId);

    return () => {
      socket.off("orderStatusUpdated", handleOrderStatusUpdate);
      socket.emit("leaveUserRoom", authUserId);
    };
  }, [authUserId, queryClient]);

  // Save local status updates to localStorage
  const saveLocalStatusUpdates = (updates) => {
    localStorage.setItem('localOrderStatusUpdates', JSON.stringify(updates));
    setLocalStatusUpdates(updates);
  };

  // Get the effective status (real-time update, local update, or original)
  const getEffectiveStatus = (orderId, originalStatus) => {
    // Priority: Real-time > Local > Original
    if (realTimeStatusUpdates[orderId]) {
      return realTimeStatusUpdates[orderId].status;
    }
    return localStatusUpdates[orderId] || originalStatus;
  };

  // Check if status has real-time updates
  const hasRealTimeUpdate = (orderId) => {
    return !!realTimeStatusUpdates[orderId];
  };

  // Check if status has local updates
  const hasLocalUpdate = (orderId) => {
    return !!localStatusUpdates[orderId];
  };

  // Sync local updates with backend when available
  const syncLocalUpdates = async () => {
    const updates = Object.entries(localStatusUpdates);
    if (updates.length === 0) {
      toast.info("No local updates to sync");
      return;
    }

    console.log("🔄 Syncing local updates:", updates);

    // Try to sync each update
    for (const [orderId, status] of updates) {
      try {
        // Uncomment this when backend is ready
        // await updateOrderStatus(token, orderId, status, sellerId);
        console.log(`✅ Synced order ${orderId} to ${status}`);
      } catch (error) {
        console.error(`❌ Failed to sync order ${orderId}:`, error);
        toast.error(`Failed to sync order ${orderId}`);
        return;
      }
    }

    // Clear local updates after successful sync
    saveLocalStatusUpdates({});
    toast.success("All local updates synced successfully!");
  };

  // Check if there are any local updates
  const hasLocalUpdates = Object.keys(localStatusUpdates).length > 0;

  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("userId");
  const sellerId = userId;

  // Debugging: Log token and userId
  console.log("Token:", token);
  console.log("User ID:", userId);

  // Fetch categories
  const { data: categories = [] } = useQuery(["categories"], fetchCategories);

  // Fetch user details
  const { data: userDetails } = useQuery(
    ['userDetails', token],
    () => fetchUserDetails(sellerId, token),
    {
      enabled: authState.isAuthenticated,
      retry: 1,
      onError: (err) => {
        console.error("Failed to fetch user details:", err);
      }
    }
  );

  // Fetch products
  const { data: products = [] } = useQuery(["products", sellerId], () =>
    fetchProducts(sellerId)
  );

  // Fetch sold items
  const { data: soldItems = [] } = useQuery(["soldItems", sellerId], () => {
    console.log("🔍 Fetching sold items for sellerId:", sellerId);
    return fetchSoldItems(token, sellerId);
  }, {
    onSuccess: (data) => {
      console.log("✅ Fetched Sold Items:", data);
      // Log the first item to understand structure
      if (data && data.length > 0) {
        console.log("📦 Sample Sold Item (Complete):", JSON.stringify(data[0], null, 2));
        console.log("📦 Sample Sold Item Keys:", Object.keys(data[0]));
      }
    },
    onError: (error) => {
      console.error("❌ Error fetching sold items:", error);
    }
  });

  // Fetch my orders with debugging
  const { data: myOrders = [] } = useQuery(
    ["myOrders", userId],
    () => {
      console.log("Fetching orders for user:", userId); // Debugging
      return fetchMyOrders(token, userId);
    },
    {
      onSuccess: (data) => {
        console.log("Fetched Orders:", data); // Debugging
      },
      onError: (error) => {
        console.error("Error fetching orders:", error); // Debugging
      },
    }
  );

  // Add product mutation
  const addProductMutation = useMutation((newProduct) => addProduct(token, newProduct), {
    onSuccess: () => {
      queryClient.invalidateQueries(["products", sellerId]);
      toast.success("Product added successfully!");
    },
    onError: () => {
      toast.error("Failed to add product.");
    },
  });

  // Delete product mutation
  const deleteProductMutation = useMutation((productId) => deleteProduct(productId, token), {
    onSuccess: () => {
      queryClient.invalidateQueries(["products", sellerId]);
      toast.success("Product deleted successfully!");
    },
    onError: () => {
      toast.error("Failed to delete product.");
    },
  });

  // Mark as sold mutation
  const markAsSoldMutation = useMutation(
    (productId) => updateProductStatus(productId, token, true),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(["products", sellerId]);
        toast.success("Product marked as sold!");
      },
      onError: () => {
        toast.error("Failed to mark product as sold.");
      },
    }
  );

  // Update order status mutation
  const updateStatusMutation = useMutation(
    ({ orderId, status }) => updateOrderStatus(token, orderId, status, sellerId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(["soldItems", sellerId]); // Refresh sold items after status update
        queryClient.invalidateQueries(["myOrders", userId]); // Also refresh my orders
        toast.success("Order status updated successfully!");
      },
      onError: (error) => {
        console.error("Error updating order status:", error);
        toast.error(error.message || "Failed to update order status.");
      },
    }
  );

  const handleAddProduct = (newProduct) => {
    addProductMutation.mutate(newProduct);
  };

  const handleDeleteProduct = (productId) => {
    deleteProductMutation.mutate(productId);
  };

  const handleEditProduct = (product) => {
    setEditProduct(product);
    setShowAddProductModal(true);
  };

  const handleMarkAsSold = (productId) => {
    markAsSoldMutation.mutate(productId);
  };

  const handleUpdateStatus = (orderId, status) => {
    console.log("🔄 Updating order status:", { orderId, status });

    if (!orderId || !status) {
      toast.error("Invalid order ID or status");
      return;
    }

    // Use the real API to update status
    updateStatusMutation.mutate({ orderId, status }, {
      onSuccess: (data) => {
        console.log("✅ Status updated successfully via API:", data);

        // Send real-time notification to buyer via socket server
        const orderDetails = soldItems.find(item => item._id === orderId);
        if (orderDetails && orderDetails.buyerId) {
          // Emit notification to socket server for real-time delivery
          const notificationData = {
            type: 'status_update',
            title: 'Order Status Updated',
            message: `Your order "${orderDetails.itemId?.name}" status has been updated to ${status}`,
            orderId: orderId,
            itemName: orderDetails.itemId?.name,
            newStatus: status,
            updatedBy: userDetails?.fname || "Seller",
            buyerId: orderDetails.buyerId,
            timestamp: new Date().toISOString()
          };

          console.log("📡 Emitting notification to socket server:", notificationData);

          // Emit to socket server for real-time notification
          socket.emit("sendNotification", notificationData);

          // Also emit the specific order status update event
          socket.emit("orderStatusUpdated", {
            orderId,
            newStatus: status,
            updatedBy: userDetails?.fname || "Seller",
            itemName: orderDetails.itemId?.name,
            buyerId: orderDetails.buyerId
          });
        }

        // Emit socket event for real-time updates (when socket server is available)
        if (orderDetails) {
          const statusUpdateData = {
            orderId,
            newStatus: status,
            updatedBy: userDetails?.fname || "Seller",
            buyerId: orderDetails.buyerId,
            orderDetails: {
              itemName: orderDetails.itemId?.name,
              itemPrice: orderDetails.itemId?.price,
              orderDate: orderDetails.createdAt
            }
          };

          console.log("📡 Emitting order status update:", statusUpdateData);

          // Emit to socket for real-time updates
          socket.emit("updateOrderStatus", statusUpdateData);

          // Also emit to buyer's room for immediate notification
          if (orderDetails.buyerId) {
            socket.emit("notifyBuyer", {
              buyerId: orderDetails.buyerId,
              message: `Your order "${orderDetails.itemId?.name}" status has been updated to ${status}`,
              orderId,
              newStatus: status,
              updatedBy: userDetails?.fname || "Seller"
            });
          }
        }

        toast.success(`Order status updated to ${status}!`);
      },
      onError: (error) => {
        console.error("❌ Failed to update status:", error);
        toast.error(error.message || "Failed to update order status. Please try again.");
      }
    });
  };

  // Filter and sort products
  const filterAndSortProducts = (productsToFilter) => {
    let filtered = productsToFilter;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort
    switch (sortBy) {
      case "price-low":
        filtered = filtered.sort((a, b) => a.price - b.price);
        break;
      case "price-high":
        filtered = filtered.sort((a, b) => b.price - a.price);
        break;
      case "name":
        filtered = filtered.sort((a, b) => a.name?.localeCompare(b.name));
        break;
      case "date":
      default:
        filtered = filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
    }

    return filtered;
  };

  const pendingProducts = filterAndSortProducts(products.filter((product) => product.status === "Pending"));
  const approvedProducts = filterAndSortProducts(products.filter((product) => product.status === "Approved"));
  const rejectedProducts = filterAndSortProducts(products.filter((product) => product.status === "Rejected"));

  // Get statistics
  const getStats = () => {
    const totalProducts = products.length;
    const pendingCount = products.filter(p => p.status === "Pending").length;
    const approvedCount = products.filter(p => p.status === "Approved").length;
    const rejectedCount = products.filter(p => p.status === "Rejected").length;
    const soldCount = soldItems.length;
    const orderCount = myOrders.length;

    // Calculate revenue
    const totalRevenue = soldItems.reduce((sum, item) => sum + (item.itemId?.price || 0), 0);

    // Calculate growth (mock data for now)
    const growthRate = 15.5; // Mock growth percentage

    return {
      totalProducts,
      pendingCount,
      approvedCount,
      rejectedCount,
      soldCount,
      orderCount,
      totalRevenue,
      growthRate
    };
  };

  const stats = getStats();

  // Handle bulk selection
  const handleProductSelection = (productId) => {
    setSelectedProducts(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handleBulkDelete = () => {
    if (selectedProducts.length > 0) {
      const confirmed = window.confirm(`Are you sure you want to delete ${selectedProducts.length} products?`);
      if (confirmed) {
        selectedProducts.forEach(productId => handleDeleteProduct(productId));
        setSelectedProducts([]);
        setShowBulkActions(false);
        toast.success(`${selectedProducts.length} products deleted successfully!`);
      }
    }
  };

  const renderProducts = (productsToShow) => (
    <div className={`mt-6 ${viewMode === "grid"
      ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6"
      : "space-y-4"
      }`}>
      {productsToShow.map((product, index) => (
        <div
          key={product._id}
          className={`group bg-white rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-3 border border-gray-100 relative ${viewMode === "list" ? "flex" : ""
            }`}
          style={{
            animationDelay: `${index * 100}ms`,
            animation: 'fadeInUp 0.6s ease-out forwards'
          }}
        >
          {/* Selection Checkbox */}
          <div className="absolute top-4 left-4 z-10">
            <input
              type="checkbox"
              checked={selectedProducts.includes(product._id)}
              onChange={() => handleProductSelection(product._id)}
              className="w-5 h-5 text-amber-500 bg-white border-2 border-gray-300 rounded-lg focus:ring-amber-500 focus:ring-2"
            />
          </div>

          {/* Product Image */}
          <div className={`relative overflow-hidden ${viewMode === "list" ? "w-48 h-32" : "h-56"}`}>
            <img
              src={`https://localhost:3000/item_images/${product.image}`}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
            />

            {/* Status Badge */}
            <div className="absolute top-4 right-4">
              <span className={`px-4 py-2 rounded-full text-xs font-bold text-white shadow-lg ${product.status === "Pending" ? "bg-gradient-to-r from-yellow-400 to-yellow-600" :
                product.status === "Approved" ? "bg-gradient-to-r from-green-400 to-green-600" :
                  "bg-gradient-to-r from-red-400 to-red-600"
                }`}>
                {product.status}
              </span>
            </div>

            {/* Hover Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col justify-end p-6">
              <h3 className="text-white font-bold text-xl mb-2">{product.name}</h3>
              <p className="text-white/90 text-sm mb-3 line-clamp-2">{product.description}</p>
              <p className="text-white font-bold text-2xl flex items-center gap-2">
                Rs {product.price}
              </p>

              {/* Quick Actions */}
              <div className="flex gap-2 mt-4">
                <button className="p-2 bg-white/20 backdrop-blur-sm text-white rounded-lg hover:bg-white/30 transition-all duration-300">
                  <FaEye className="text-sm" />
                </button>
                <button className="p-2 bg-white/20 backdrop-blur-sm text-white rounded-lg hover:bg-white/30 transition-all duration-300">
                  <FaHeart className="text-sm" />
                </button>
                <button className="p-2 bg-white/20 backdrop-blur-sm text-white rounded-lg hover:bg-white/30 transition-all duration-300">
                  <FaShare className="text-sm" />
                </button>
              </div>
            </div>

            {/* Floating Action Buttons */}
            <div className="absolute top-4 left-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
              <div className="flex flex-col gap-2">
                {activeTab === "Pending" && (
                  <>
                    <button
                      className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-all duration-300 shadow-lg hover:shadow-xl"
                      onClick={() => handleEditProduct(product)}
                      title="Edit Product"
                    >
                      <FaEdit className="text-sm" />
                    </button>
                    <button
                      className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-all duration-300 shadow-lg hover:shadow-xl"
                      onClick={() => handleDeleteProduct(product._id)}
                      title="Delete Product"
                    >
                      <FaTrash className="text-sm" />
                    </button>
                  </>
                )}
                {activeTab === "Approved" && (
                  <button
                    className="p-2 bg-green-500 text-white rounded-full hover:bg-green-600 transition-all duration-300 shadow-lg hover:shadow-xl"
                    onClick={() => handleMarkAsSold(product._id)}
                    title="Mark as Sold"
                  >
                    <FaCheck className="text-sm" />
                  </button>
                )}
                {activeTab === "Rejected" && (
                  <button
                    className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-all duration-300 shadow-lg hover:shadow-xl"
                    onClick={() => handleDeleteProduct(product._id)}
                    title="Delete Product"
                  >
                    <FaTrash className="text-sm" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Product Info */}
          <div className={`p-6 ${viewMode === "list" ? "flex-1" : ""}`}>
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-bold text-gray-800 text-lg line-clamp-1">{product.name}</h3>
              <div className="flex items-center gap-1 text-amber-500">
                <FaStar className="text-sm" />
                <span className="text-sm font-semibold">4.5</span>
              </div>
            </div>

            <p className="text-gray-600 text-sm mb-4 line-clamp-2">{product.description}</p>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-600 font-bold text-2xl flex items-center gap-1">
                  Rs {product.price}
                </p>
                <p className="text-gray-500 text-xs">Added {new Date(product.createdAt).toLocaleDateString()}</p>
              </div>

              {/* View Mode Actions */}
              {viewMode === "list" && (
                <div className="flex gap-2">
                  {activeTab === "Pending" && (
                    <>
                      <button
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all duration-300"
                        onClick={() => handleEditProduct(product)}
                      >
                        <FaEdit className="text-sm mr-2" />
                        Edit
                      </button>
                      <button
                        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all duration-300"
                        onClick={() => handleDeleteProduct(product._id)}
                      >
                        <FaTrash className="text-sm mr-2" />
                        Delete
                      </button>
                    </>
                  )}
                  {activeTab === "Approved" && (
                    <button
                      className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all duration-300"
                      onClick={() => handleMarkAsSold(product._id)}
                    >
                      <FaCheck className="text-sm mr-2" />
                      Mark Sold
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderOrders = (orders, title, isSoldItems = false) => (
    <div className="mt-6">
      <h3 className="text-3xl font-bold text-gray-800 mb-8 flex items-center gap-4">
        <div className={`p-3 rounded-2xl text-white ${isSoldItems
          ? "bg-gradient-to-r from-amber-500 to-orange-600"
          : "bg-gradient-to-r from-blue-500 to-purple-600"}`}>
          {isSoldItems ? <FaBox className="text-2xl" /> : <FaShoppingCart className="text-2xl" />}
        </div>
        {title}
      </h3>

      {!Array.isArray(orders) || orders.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-32 h-32 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
            {isSoldItems ? <FaBox className="text-gray-400 text-5xl" /> : <FaShoppingCart className="text-gray-400 text-5xl" />}
          </div>
          <h4 className="text-2xl font-bold text-gray-600 mb-2">No {title.toLowerCase()} found</h4>
          <p className="text-gray-500">Start selling to see your orders here</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                <tr>
                  <th className="px-8 py-6 text-left text-sm font-bold text-gray-700">Image</th>
                  <th className="px-8 py-6 text-left text-sm font-bold text-gray-700">Item Details</th>
                  <th className="px-8 py-6 text-left text-sm font-bold text-gray-700">Price</th>
                  <th className="px-8 py-6 text-left text-sm font-bold text-gray-700">Status</th>
                  {isSoldItems && (
                    <th className="px-8 py-6 text-left text-sm font-bold text-gray-700">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {orders.map((order, index) => (
                  <tr key={order._id} className="hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 transition-all duration-300">
                    <td className="px-8 py-6">
                      {order.itemId?.image ? (
                        <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-gray-200 shadow-lg">
                          <img
                            src={`https://localhost:3000/item_images/${order.itemId.image}`}
                            alt={order.itemId.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-r from-gray-100 to-gray-200 flex items-center justify-center border-2 border-gray-200">
                          <FaImage className="text-gray-400 text-2xl" />
                        </div>
                      )}
                    </td>
                    <td className="px-8 py-6">
                      <div>
                        <p className="font-bold text-gray-800 text-lg">{order.itemId?.name || "N/A"}</p>
                        <p className="text-gray-500 text-sm">Order ID: {order._id.slice(-8)}</p>
                        <p className="text-gray-400 text-xs">Ordered on {new Date(order.createdAt || Date.now()).toLocaleDateString()}</p>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <p className="font-bold text-amber-600 text-xl flex items-center gap-2">
                        Rs {order.itemId?.price || "N/A"}
                      </p>
                    </td>
                    <td className="px-8 py-6">
                      <span className={`px-4 py-2 rounded-full text-sm font-bold ${order.status === "pending" ? "bg-yellow-100 text-yellow-800 border border-yellow-200" :
                        order.status === "paid" ? "bg-blue-100 text-blue-800 border border-blue-200" :
                          order.status === "shipped" ? "bg-purple-100 text-purple-800 border border-purple-200" :
                            order.status === "delivered" ? "bg-green-100 text-green-800 border border-green-200" :
                              "bg-gray-100 text-gray-800 border border-gray-200"
                        }`}>
                        {order.status || "N/A"}
                      </span>
                    </td>
                    {isSoldItems && (
                      <td className="px-8 py-6">
                        {(() => {
                          // Check if current user is the seller of this order
                          const isOwner = order.sellerId === sellerId || order.itemId?.sellerId === sellerId;
                          const effectiveStatus = getEffectiveStatus(order._id, order.status);
                          const hasLocalUpdateFlag = hasLocalUpdate(order._id);
                          const hasRealTimeUpdateFlag = hasRealTimeUpdate(order._id);

                          console.log("🔍 Order ownership check:", {
                            orderId: order._id,
                            orderSellerId: order.sellerId,
                            itemSellerId: order.itemId?.sellerId,
                            currentSellerId: sellerId,
                            isOwner,
                            originalStatus: order.status,
                            effectiveStatus,
                            hasLocalUpdate: hasLocalUpdateFlag,
                            hasRealTimeUpdate: hasRealTimeUpdateFlag
                          });

                          if (!isOwner) {
                            return (
                              <span className="text-gray-500 text-sm">
                                Not authorized to update
                              </span>
                            );
                          }

                          return (
                            <div className="space-y-2">
                              {/* Status Dropdown */}
                              <div className="relative">
                                <select
                                  value={effectiveStatus}
                                  onChange={(e) => handleUpdateStatus(order._id, e.target.value)}
                                  disabled={updateStatusMutation.isLoading}
                                  className="px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm font-semibold bg-white shadow-sm transition-all duration-300 hover:border-amber-400 w-full disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  <option value="pending">⏳ Pending</option>
                                  <option value="paid">💰 Paid</option>
                                  <option value="shipped">🚚 Shipped</option>
                                  <option value="delivered">✅ Delivered</option>
                                </select>

                                {/* Loading Indicator */}
                                {updateStatusMutation.isLoading && (
                                  <div className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full font-bold animate-pulse">
                                    UPDATING...
                                  </div>
                                )}

                                {/* Real-Time Update Indicator */}
                                {hasRealTimeUpdateFlag && !updateStatusMutation.isLoading && (
                                  <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                                    LIVE
                                  </div>
                                )}
                              </div>

                              {/* Status Info */}
                              <div className="text-xs text-gray-500">
                                {hasRealTimeUpdateFlag && (
                                  <div className="bg-green-50 p-2 rounded-lg border border-green-200">
                                    <div className="flex items-center gap-1 mb-1">
                                      <span className="text-green-600">🔔</span>
                                      <span className="font-medium text-green-800">Live Update</span>
                                    </div>
                                    <p className="text-green-700">
                                      Status updated by {realTimeStatusUpdates[order._id]?.updatedBy} at {new Date(realTimeStatusUpdates[order._id]?.timestamp).toLocaleTimeString()}
                                    </p>
                                  </div>
                                )}
                                {!hasRealTimeUpdateFlag && (
                                  <div className="bg-gray-50 p-2 rounded-lg border border-gray-200">
                                    <div className="flex items-center gap-1 mb-1">
                                      <span className="text-gray-600">ℹ️</span>
                                      <span className="font-medium text-gray-800">Current Status</span>
                                    </div>
                                    <p className="text-gray-700">
                                      Status: {effectiveStatus}
                                    </p>
                                  </div>
                                )}
                              </div>

                              {/* Quick Actions */}
                              <div className="flex gap-2">
                                <button
                                  onClick={() => {
                                    // Copy order details to clipboard
                                    const orderInfo = `Order ID: ${order._id}\nItem: ${order.itemId?.name}\nStatus: ${effectiveStatus}`;
                                    navigator.clipboard.writeText(orderInfo);
                                    toast.success("Order details copied to clipboard!");
                                  }}
                                  className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs hover:bg-gray-200 transition-colors"
                                >
                                  📋 Copy Details
                                </button>
                              </div>
                            </div>
                          );
                        })()}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )
      }
    </div >
  );

  const renderActiveTab = () => {
    if (activeTab === "Pending") return renderProducts(pendingProducts);
    if (activeTab === "Approved") return renderProducts(approvedProducts);
    if (activeTab === "Rejected") return renderProducts(rejectedProducts);
    if (activeTab === "My Orders") {
      // Mark status update notifications as read when user views My Orders
      const statusNotifications = notifications.filter(n =>
        n.buyerId === authUserId &&
        n.type === 'status_update' &&
        !n.read
      );

      if (statusNotifications.length > 0) {
        // Mark notifications as read
        const updatedNotifications = notifications.map(n =>
          n.buyerId === authUserId && n.type === 'status_update'
            ? { ...n, read: true }
            : n
        );
        setNotifications(updatedNotifications);
      }

      return renderOrders(myOrders, "My Orders");
    }
    if (activeTab === "Sold Items") return renderOrders(soldItems, "Sold Items", true);
    return <p>No data found.</p>;
  };

  // Get unread notification count from socket notifications
  const getUnreadNotificationCount = () => {
    if (!authUserId) return 0;

    // Use the notifications from NotificationContext (socket-based)
    return notifications.filter(n =>
      n.buyerId === authUserId &&
      n.type === 'status_update' &&
      !n.read
    ).length;
  };

  const unreadNotificationCount = getUnreadNotificationCount();

  const tabConfig = [
    { name: "Pending", icon: FaClock, color: "yellow", count: stats.pendingCount, gradient: "from-yellow-400 to-yellow-600" },
    { name: "Approved", icon: FaCheckCircle, color: "green", count: stats.approvedCount, gradient: "from-green-400 to-green-600" },
    { name: "Rejected", icon: FaTimes, color: "red", count: stats.rejectedCount, gradient: "from-red-400 to-red-600" },
    {
      name: "My Orders",
      icon: FaShoppingCart,
      color: "blue",
      count: stats.orderCount,
      gradient: "from-blue-400 to-blue-600",
      notificationCount: unreadNotificationCount
    },
    { name: "Sold Items", icon: FaBox, color: "amber", count: stats.soldCount, gradient: "from-amber-400 to-amber-600" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      <Header />
      <Banner />
      <ProfileImage userDetails={userDetails || { fname: "", email: "", city: "" }} />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 mb-8 border border-white/20">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-3">
                My Dashboard
              </h1>
              <p className="text-gray-600 text-lg">Manage your products, orders, and sales with ease</p>
            </div>

            <div className="flex gap-4">
              <button
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white px-8 py-4 rounded-2xl font-bold transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl flex items-center gap-3"
                onClick={() => setShowAddProductModal(true)}
              >
                <FaPlus className="text-lg" />
                Add New Product
              </button>



              <button className="p-4 bg-white/50 backdrop-blur-sm border border-gray-200 rounded-2xl hover:bg-white/80 transition-all duration-300">
                <FaCog className="text-gray-600 text-xl" />
              </button>
            </div>
          </div>

          {/* Enhanced Statistics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6 mt-10">
            <div className="bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 text-white p-6 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm opacity-90 font-medium">Total Products</p>
                  <p className="text-3xl font-bold">{stats.totalProducts}</p>
                </div>
                <div className="p-3 bg-white/20 rounded-2xl">
                  <FaChartLine className="text-2xl" />
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <FaChartLine className="text-green-300" />
                <span>+12% this month</span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600 text-white p-6 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm opacity-90 font-medium">Pending</p>
                  <p className="text-3xl font-bold">{stats.pendingCount}</p>
                </div>
                <div className="p-3 bg-white/20 rounded-2xl">
                  <FaClock className="text-2xl" />
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <FaClock className="text-yellow-200" />
                <span>Awaiting approval</span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-400 via-green-500 to-green-600 text-white p-6 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm opacity-90 font-medium">Approved</p>
                  <p className="text-3xl font-bold">{stats.approvedCount}</p>
                </div>
                <div className="p-3 bg-white/20 rounded-2xl">
                  <FaCheckCircle className="text-2xl" />
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <FaCheckCircle className="text-green-200" />
                <span>Ready to sell</span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-red-400 via-red-500 to-red-600 text-white p-6 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm opacity-90 font-medium">Rejected</p>
                  <p className="text-3xl font-bold">{stats.rejectedCount}</p>
                </div>
                <div className="p-3 bg-white/20 rounded-2xl">
                  <FaTimes className="text-2xl" />
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <FaTimes className="text-red-200" />
                <span>Needs revision</span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 text-white p-6 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm opacity-90 font-medium">Sold Items</p>
                  <p className="text-3xl font-bold">{stats.soldCount}</p>
                </div>
                <div className="p-3 bg-white/20 rounded-2xl">
                  <FaBox className="text-2xl" />
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <FaDollarSign className="text-amber-200" />
                <span>Rs{stats.totalRevenue}</span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-indigo-400 via-indigo-500 to-indigo-600 text-white p-6 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm opacity-90 font-medium">My Orders</p>
                  <p className="text-3xl font-bold">{stats.orderCount}</p>
                </div>
                <div className="p-3 bg-white/20 rounded-2xl">
                  <FaShoppingCart className="text-2xl" />
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <FaUsers className="text-indigo-200" />
                <span>Active orders</span>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Filters and Search */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl p-8 mb-8 border border-white/20">
          <div className="flex flex-col lg:flex-row gap-6 items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg" />
                <input
                  type="text"
                  placeholder="Search products by name or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white/50 backdrop-blur-sm"
                />
              </div>

              {/* Sort */}
              <div className="relative">
                <FaSort className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="pl-12 pr-8 py-4 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 appearance-none bg-white/50 backdrop-blur-sm font-semibold"
                >
                  <option value="date">📅 Sort by Date</option>
                  <option value="name">📝 Sort by Name</option>
                  <option value="price-low">💰 Price: Low to High</option>
                  <option value="price-high">💰 Price: High to Low</option>
                </select>
              </div>

              {/* View Mode Toggle */}
              <div className="flex bg-gray-100 rounded-2xl p-1">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`px-4 py-3 rounded-xl transition-all duration-300 ${viewMode === "grid"
                    ? "bg-white shadow-lg text-amber-600"
                    : "text-gray-600 hover:text-gray-800"
                    }`}
                >
                  <FaEye className="text-lg" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`px-4 py-3 rounded-xl transition-all duration-300 ${viewMode === "list"
                    ? "bg-white shadow-lg text-amber-600"
                    : "text-gray-600 hover:text-gray-800"
                    }`}
                >
                  <FaList className="text-lg" />
                </button>
              </div>
            </div>

            {/* Active Tab Display */}
            <div className="text-right">
              <p className="text-sm text-gray-500 font-medium">Current View</p>
              <p className="font-bold text-gray-800 text-lg">{activeTab}</p>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedProducts.length > 0 && (
            <div className="mt-6 p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border border-amber-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="font-semibold text-amber-800">
                    {selectedProducts.length} products selected
                  </span>
                  <button
                    onClick={() => setSelectedProducts([])}
                    className="text-amber-600 hover:text-amber-800 font-medium"
                  >
                    Clear Selection
                  </button>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleBulkDelete}
                    className="px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all duration-300 flex items-center gap-2"
                  >
                    <FaTrash />
                    Delete Selected
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Enhanced Tab Navigation */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl p-6 mb-8 border border-white/20">
          <div className="flex flex-wrap gap-3">
            {tabConfig.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.name}
                  className={`flex items-center gap-3 px-6 py-4 rounded-2xl text-sm font-bold transition-all duration-300 transform hover:scale-105 relative ${activeTab === tab.name
                    ? `bg-gradient-to-r ${tab.gradient} text-white shadow-xl`
                    : "bg-white/50 backdrop-blur-sm text-gray-700 hover:bg-white/80 border border-gray-200"
                    }`}
                  onClick={() => setActiveTab(tab.name)}
                >
                  <Icon className="text-lg" />
                  {tab.name}
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${activeTab === tab.name ? "bg-white/20" : "bg-gray-200"
                    }`}>
                    {tab.count}
                  </span>

                  {/* Notification Badge */}
                  {tab.notificationCount > 0 && (
                    <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full font-bold animate-pulse">
                      {/* <FaBell className="text-xs" /> */} {/* Removed FaBell import, so commenting out */}
                      {tab.notificationCount}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Area */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl p-8 border border-white/20">
          {renderActiveTab()}
        </div>
      </div>

      {showAddProductModal && (
        <Form
          setShowAddProductModal={setShowAddProductModal}
          editProduct={editProduct}
          handleAddProduct={handleAddProduct}
        />
      )}

      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .line-clamp-1 {
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default MyAccount;