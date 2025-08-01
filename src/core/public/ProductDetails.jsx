import { useMutation, useQuery } from "@tanstack/react-query";
import React, { useEffect, useState } from "react";
import {
  FaArrowLeft,
  FaCheckCircle,
  FaComments,
  FaEye,
  FaMapMarkerAlt,
  FaReply,
  FaShareAlt,
  FaShieldAlt,
  FaShoppingCart,
  FaTag,
  FaTimesCircle,
  FaTrash,
  FaUser,
  FaWhatsapp
} from "react-icons/fa";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import io from "socket.io-client";
import Footer from "../../components/Footer";
import Header from "../../components/header";
import { useAuth } from "../../context/AuthContext";
import {
  addComment,
  addReply,
  createOrder,
  deleteComment,
  fetchCategoryDetails,
  fetchComments,
  fetchNotifications,
  fetchProductDetails,
  fetchUserDetails,
  incrementViewCount,
} from "../../services/apiServices";

const socket = io("http://localhost:3000");

function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [replyText, setReplyText] = useState({});
  const { isLoggedIn, userId: loggedInUserId, token } = useAuth();
  const [viewCount, setViewCount] = useState(0);
  const [showReplyInput, setShowReplyInput] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [isItemOrdered, setIsItemOrdered] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);

  const { data: product, isLoading: productLoading } = useQuery(
    ["productDetails", id],
    () => fetchProductDetails(id),
    { enabled: !!id }
  );

  const { data: categoryName, isLoading: categoryLoading } = useQuery(
    ["categoryDetails", product?.categoryId],
    () => fetchCategoryDetails(product?.categoryId),
    { enabled: !!product?.categoryId }
  );

  const { data: user, isLoading: userLoading, error: userError } = useQuery(
    ["sellerDetails", product?.sellerId],
    () => {
      console.log('🔍 Fetching user details for sellerId:', product?.sellerId, 'with token:', token ? 'present' : 'missing');
      return fetchUserDetails(product?.sellerId);
    },
    {
      enabled: !!product?.sellerId && isLoggedIn && !!token,
      retry: 1,
      retryDelay: 1000,
      onError: (error) => {
        console.warn('Failed to fetch seller details:', error.message);
        if (error.response?.status === 401) {
          console.warn('Token might be expired or invalid');
        }
      }
    }
  );

  const { data: comments, refetch: refetchComments } = useQuery(
    ["comments", id],
    () => fetchComments(id),
    { enabled: !!id }
  );

  const handleBuyNow = async () => {
    if (!isLoggedIn) {
      toast.error("You need to log in to buy this item.");
      navigate("/login");
      return;
    }

    if (product.sellerId === loggedInUserId) {
      toast.warning("You cannot buy your own item!");
      return;
    }

    if (isItemOrdered) {
      toast.warning("You have already ordered this item!");
      return;
    }

    try {
      setLoading(true);

      console.log("🔍 Sending Order Request:", {
        itemId: product._id,
        buyerId: loggedInUserId,
        sellerId: product.sellerId,
      });

      const orderResponse = await createOrder(token, product._id, loggedInUserId, product.sellerId);

      console.log("✅ Order Created Successfully:", orderResponse);

      toast.success("Purchase successful! Redirecting to your orders.");
      navigate("/my-account?tab=MyOrders");
    } catch (error) {
      console.error("❌ Error placing order:", error.response?.data || error.message);
      toast.error(`Failed to place order: ${error.response?.data?.message || "Something went wrong."}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchNotifications(loggedInUserId, token)
        .then(setNotifications)
        .catch((error) => console.error("Error fetching notifications:", error));
    }
  }, [isLoggedIn, loggedInUserId, token]);

  useEffect(() => {
    if (isLoggedIn) {
      socket.emit("joinNotifications", loggedInUserId);

      socket.on("newNotification", (notification) => {
        setNotifications((prev) => [notification, ...prev]);
      });
    }
  }, [isLoggedIn, loggedInUserId]);

  const incrementViewMutation = useMutation(() => incrementViewCount(id, loggedInUserId), {
    onSuccess: (data) => {
      setViewCount(data.viewCount);
    },
  });

  useEffect(() => {
    if (isLoggedIn && product) {
      incrementViewMutation.mutate();
    }
  }, [isLoggedIn, product]);

  const handleShare = () => {
    const productUrl = window.location.href;
    navigator.clipboard.writeText(productUrl);
    toast.info("🔗 Product link copied to clipboard!");
  };

  const handleAddComment = async () => {
    if (!isLoggedIn) {
      toast.error("You need to log in to add a comment.");
      return;
    }
    if (!commentText.trim()) {
      toast.warning("Comment cannot be empty.");
      return;
    }

    try {
      await addComment(token, { itemId: id, text: commentText });

      if (loggedInUserId !== product?.userId) {
        socket.emit("sendNotification", {
          userId: product?.userId,
          notification: {
            message: `You have a new comment on "${product.name}". Click to view.`,
            link: `/product/${id}`,
          },
        });
      }

      setCommentText("");
      refetchComments();
    } catch (error) {
      console.error("❌ Error adding comment:", error.response?.data || error.message);
    }
  };

  const handleReply = async (commentId) => {
    if (!replyText[commentId]?.trim()) {
      toast.warning("Reply cannot be empty!");
      return;
    }

    try {
      await addReply(token, commentId, { text: replyText[commentId] });
      setReplyText({ ...replyText, [commentId]: "" });
      setShowReplyInput(null);
      refetchComments();
    } catch (error) {
      toast.error("Failed to add reply!");
    }
  };

  const handleDeleteComment = async (commentId, commentUserId) => {
    if (loggedInUserId !== commentUserId && loggedInUserId !== product?.userId) {
      toast.error("You are not authorized to delete this comment.");
      return;
    }

    try {
      await deleteComment(token, commentId);
      toast.success("Comment deleted successfully.");
      refetchComments();
    } catch (error) {
      toast.error("Failed to delete comment.");
    }
  };

  if (productLoading || categoryLoading || userLoading) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-700 text-xl font-semibold">Loading amazing product details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <FaTimesCircle className="text-red-500 text-6xl mx-auto mb-4" />
            <p className="text-gray-700 text-xl font-semibold">Product not found</p>
            <button
              onClick={() => navigate('/')}
              className="mt-4 px-6 py-3 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-all duration-300"
            >
              <FaArrowLeft className="inline mr-2" />
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />

      <div className="container mx-auto p-6 mt-[80px]">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all duration-300"
        >
          <FaArrowLeft />
          Back
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Product Images Section */}
          <div className="space-y-6">
            <div className="relative group">
              <div className="overflow-hidden rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 shadow-2xl">
                <img
                  src={`https://localhost:3000/item_images/${product.image}`}
                  alt={product.name}
                  className="w-full h-[500px] object-cover transform transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              </div>

              {/* Status Badge */}
              <div className="absolute top-4 right-4">
                {product.status === "sold" ? (
                  <span className="px-4 py-2 bg-red-500 text-white rounded-full text-sm font-semibold shadow-lg">
                    <FaTimesCircle className="inline mr-1" />
                    Sold
                  </span>
                ) : (
                  <span className="px-4 py-2 bg-green-500 text-white rounded-full text-sm font-semibold shadow-lg">
                    <FaCheckCircle className="inline mr-1" />
                    Available
                  </span>
                )}
              </div>
            </div>

            {/* Thumbnail */}
            <div className="flex justify-center">
              <div className="overflow-hidden rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 shadow-lg">
                <img
                  src={`https://localhost:3000/item_images/${product.image}`}
                  alt="Product Thumbnail"
                  className="w-24 h-24 object-cover"
                />
              </div>
            </div>
          </div>

          {/* Product Details Section */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-2xl">
              {/* Product Title */}
              <h1 className="text-4xl font-bold text-gray-800 mb-4">
                {product.name}
              </h1>

              {/* Price */}
              <div className="mb-6">
                <span className="text-3xl font-bold text-amber-600">Rs {product.price}</span>
                <span className="text-gray-500 ml-2 text-lg">(Negotiable)</span>
              </div>

              {/* Category */}
              <div className="flex items-center gap-2 mb-4">
                <FaTag className="text-amber-500" />
                <span className="text-gray-700">
                  <strong>Category:</strong> {categoryName?.category_name || "N/A"}
                </span>
              </div>

              {/* Description */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Description</h3>
                <p className="text-gray-600 leading-relaxed">{product.description}</p>
              </div>

              {/* Product Features */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="flex items-center gap-2">
                  {product.isRefundable ? (
                    <FaCheckCircle className="text-green-500" />
                  ) : (
                    <FaTimesCircle className="text-red-500" />
                  )}
                  <span className="text-gray-700">Refundable</span>
                </div>
                <div className="flex items-center gap-2">
                  {product.isExchangeable ? (
                    <FaCheckCircle className="text-green-500" />
                  ) : (
                    <FaTimesCircle className="text-red-500" />
                  )}
                  <span className="text-gray-700">Exchangeable</span>
                </div>
              </div>

              {/* Buy Button */}
              {!isItemOrdered && product.status !== "sold" && (
                <button
                  onClick={handleBuyNow}
                  disabled={loading}
                  className={`w-full py-4 px-6 rounded-xl text-lg font-semibold transition-all duration-300 transform hover:scale-105 ${loading
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-xl hover:shadow-2xl"
                    }`}
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Processing...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <FaShoppingCart className="mr-2" />
                      Buy Now
                    </div>
                  )}
                </button>
              )}

              {isItemOrdered && (
                <div className="bg-amber-100 border border-amber-300 rounded-xl p-4 text-center">
                  <FaCheckCircle className="text-amber-600 text-2xl mx-auto mb-2" />
                  <p className="text-amber-800 font-semibold">✅ You have already ordered this item.</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4 mt-6">
                <button className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-300">
                  <FaEye />
                  <span>{viewCount} Views</span>
                </button>
                <button
                  onClick={handleShare}
                  className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-300"
                >
                  <FaShareAlt />
                  <span>Share</span>
                </button>
              </div>
            </div>

            {/* Seller Details */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-2xl">
              <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <FaUser />
                Seller Details
              </h2>

              {isLoggedIn ? (
                userLoading ? (
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-white/20 rounded-full animate-pulse"></div>
                    <div className="space-y-2 flex-1">
                      <div className="h-4 bg-white/20 rounded animate-pulse"></div>
                      <div className="h-3 bg-white/20 rounded animate-pulse w-2/3"></div>
                    </div>
                  </div>
                ) : userError ? (
                  <div className="bg-amber-100 border border-amber-300 rounded-xl p-4">
                    <p className="text-amber-800">Unable to load seller details. Please try refreshing the page.</p>
                    {userError.response?.status === 401 && (
                      <p className="text-amber-600 text-sm mt-1">You may need to log in again.</p>
                    )}
                  </div>
                ) : user ? (
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <img
                        src={user.image ? `http://localhost:3000${user.image}` : "https://via.placeholder.com/100"}
                        alt={user.fname}
                        className="w-16 h-16 object-cover rounded-full border-2 border-white/30 shadow-lg"
                      />
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-400 rounded-full border-2 border-white"></div>
                    </div>
                    <div className="flex-1">
                      <p className="text-xl font-bold text-gray-800">{user.fname}</p>
                      <p className="text-gray-600 flex items-center gap-1">
                        <FaMapMarkerAlt className="text-amber-500" />
                        <span>Contact: {user.email}</span>
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-gray-600">WhatsApp:</span>
                        <a
                          href={`https://wa.me/${user.phone}`}
                          className="text-green-600 hover:text-green-700 transition-colors duration-300 flex items-center gap-1"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <FaWhatsapp className="text-lg" />
                          {user.phone}
                        </a>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-600">Seller information not available.</p>
                )
              ) : (
                <div className="text-center py-4">
                  <FaShieldAlt className="text-amber-500 text-3xl mx-auto mb-2" />
                  <p className="text-gray-600">Please login to see seller details.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Comments Section */}
        <div className="mt-12 bg-white rounded-2xl p-8 border border-gray-200 shadow-2xl">
          <h2 className="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <FaComments />
            Comments & Reviews
          </h2>

          {/* Add Comment */}
          {isLoggedIn && (
            <div className="mb-8">
              <div className="flex gap-4">
                <div className="flex-1">
                  <input
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    className="w-full p-4 bg-gray-50 border border-gray-300 rounded-xl text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-300"
                    placeholder="Share your thoughts about this product..."
                    onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
                  />
                </div>
                <button
                  onClick={handleAddComment}
                  className="px-6 py-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  Post
                </button>
              </div>
            </div>
          )}

          {/* Comments List */}
          <div className="space-y-6">
            {comments?.length === 0 ? (
              <div className="text-center py-8">
                <FaComments className="text-amber-500 text-4xl mx-auto mb-4" />
                <p className="text-gray-600 text-lg">No comments yet. Be the first to share your thoughts!</p>
              </div>
            ) : (
              comments?.map((comment) => (
                <div key={comment._id} className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                  <div className="flex gap-4">
                    <img
                      src={comment.userId?.image ? `http://localhost:3000${comment.userId.image}` : "https://via.placeholder.com/50"}
                      alt={comment.userId?.fname || "User"}
                      className="w-12 h-12 object-cover rounded-full border-2 border-gray-300"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <p className="font-semibold text-gray-800">{comment.userId?.fname || "Anonymous"}</p>
                        <span className="text-gray-400 text-sm">•</span>
                        <span className="text-gray-400 text-sm">Just now</span>
                      </div>
                      <p className="text-gray-700 leading-relaxed">{comment.text}</p>

                      {/* Action Buttons */}
                      <div className="flex gap-4 mt-4">
                        {(loggedInUserId === comment.userId?._id || loggedInUserId === product?.userId) && (
                          <button
                            onClick={() => handleDeleteComment(comment._id, comment.userId?._id)}
                            className="flex items-center gap-1 text-red-500 hover:text-red-600 transition-colors duration-300"
                          >
                            <FaTrash />
                            Delete
                          </button>
                        )}

                        {loggedInUserId === product?.sellerId && (
                          <button
                            onClick={() => setShowReplyInput(showReplyInput === comment._id ? null : comment._id)}
                            className="flex items-center gap-1 text-amber-600 hover:text-amber-700 transition-colors duration-300"
                          >
                            <FaReply />
                            Reply
                          </button>
                        )}
                      </div>

                      {/* Reply Input */}
                      {showReplyInput === comment._id && (
                        <div className="mt-4 flex gap-2">
                          <input
                            type="text"
                            value={replyText[comment._id] || ""}
                            onChange={(e) => setReplyText({ ...replyText, [comment._id]: e.target.value })}
                            className="flex-1 p-3 bg-white border border-gray-300 rounded-lg text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-300"
                            placeholder="Write a reply..."
                            onKeyPress={(e) => e.key === 'Enter' && handleReply(comment._id)}
                          />
                          <button
                            onClick={() => handleReply(comment._id)}
                            className="px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-lg font-semibold transition-all duration-300"
                          >
                            Send
                          </button>
                        </div>
                      )}

                      {/* Replies */}
                      {comment.replies?.map((reply) => (
                        <div key={reply._id} className="mt-4 ml-8 p-4 bg-white rounded-lg border border-gray-200">
                          <div className="flex items-center gap-2 mb-2">
                            <p className="font-semibold text-gray-800">{reply.userId?.fname || "Anonymous"}</p>
                            <span className="text-gray-400 text-sm">•</span>
                            <span className="text-gray-400 text-sm">Seller</span>
                          </div>
                          <p className="text-gray-700">{reply.text}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default ProductDetails;