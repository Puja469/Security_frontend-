import { useQuery } from "@tanstack/react-query";
import React, { useCallback, useContext, useEffect, useState } from 'react';
import {
  FaBaby,
  FaBars,
  FaBook,
  FaCamera,
  FaCar,
  FaChevronDown,
  FaChevronUp,
  FaDumbbell,
  FaGamepad,
  FaGem,
  FaHeart,
  FaHome,
  FaLaptop,
  FaList,
  FaMobile,
  FaMusic,
  FaPalette,
  FaTags,
  FaTh,
  FaTshirt,
  FaUtensils
} from "react-icons/fa";
import { useLocation, useNavigate } from "react-router-dom";
import Carousel from "../../components/Carousel";
import Footer from "../../components/Footer";
import Header from "../../components/header";
import { useRateLimit } from "../../context/RateLimitContext";
import { ThemeContext } from "../../context/ThemeContext";
import { fetchCategories, fetchRecentItems, fetchSubcategories } from "../../services/apiServices.js";

function Home() {
  const { darkMode } = useContext(ThemeContext);
  const { rateLimitStatus } = useRateLimit();
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSubcategory, setSelectedSubcategory] = useState('');
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [isListView, setIsListView] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState("");

  // Function to get appropriate icon for category - memoized to prevent re-creation
  const getCategoryIcon = useCallback((categoryName) => {
    const name = categoryName.toLowerCase();
    if (name.includes('clothing') || name.includes('fashion') || name.includes('apparel')) return FaTshirt;
    if (name.includes('electronics') || name.includes('tech')) return FaLaptop;
    if (name.includes('phone') || name.includes('mobile')) return FaMobile;
    if (name.includes('home') || name.includes('furniture')) return FaHome;
    if (name.includes('vehicle') || name.includes('car') || name.includes('auto')) return FaCar;
    if (name.includes('book') || name.includes('education')) return FaBook;
    if (name.includes('game') || name.includes('toy')) return FaGamepad;
    if (name.includes('sport') || name.includes('fitness')) return FaDumbbell;
    if (name.includes('baby') || name.includes('kid')) return FaBaby;
    if (name.includes('jewelry') || name.includes('accessory')) return FaGem;
    if (name.includes('food') || name.includes('kitchen')) return FaUtensils;
    if (name.includes('art') || name.includes('craft')) return FaPalette;
    if (name.includes('music') || name.includes('instrument')) return FaMusic;
    if (name.includes('camera') || name.includes('photo')) return FaCamera;
    return FaTags; // default icon
  }, []);



  const { data: categories = [], isLoading: categoriesLoading } = useQuery(['categories'], () =>
    fetchCategories(),
    {
      retry: 1, // Reduced from 3 to 1
      retryDelay: 3000, // Increased from 2000 to 3000
      staleTime: 10 * 60 * 1000, // Increased from 5 minutes to 10 minutes
      cacheTime: 15 * 60 * 1000, // Added cache time
      onError: (error) => {
        console.error('Failed to fetch categories:', error);
        if (error.response?.status === 429) {
          console.warn('Rate limited - categories request');
        }
        // Don't throw error for 401 on public endpoints
        if (error.response?.status === 401) {
          console.warn('401 on categories');
          return;
        }
      }
    }
  );

  const { data: subcategories = [], isLoading: subcategoriesLoading } = useQuery(
    ['subcategories', selectedCategory],
    () =>
      fetchSubcategories(selectedCategory),
    {
      enabled: !!selectedCategory,
      retry: 1, // Reduced from 2 to 1
      retryDelay: 3000,
      staleTime: 10 * 60 * 1000, // Increased from 5 minutes to 10 minutes
      cacheTime: 15 * 60 * 1000, // Added cache time
      onError: (error) => {
        console.error('Failed to fetch subcategories:', error);
        if (error.response?.status === 429) {
          console.warn('Rate limited - subcategories request');
        }
        // Don't throw error for 401 on public endpoints
        if (error.response?.status === 401) {
          console.warn('401 on subcategories - backend may require auth');
          return;
        }
      }
    }
  );

  const { data: products = [], isLoading: loadingProducts } = useQuery(
    ['products', selectedSubcategory],
    () =>
      fetchRecentItems(selectedSubcategory),
    {
      enabled: !!selectedSubcategory,
      retry: 1, // Reduced from 2 to 1
      retryDelay: 3000,
      staleTime: 5 * 60 * 1000, // Increased from 2 minutes to 5 minutes
      cacheTime: 10 * 60 * 1000, // Added cache time
      onError: (error) => {
        console.error('Failed to fetch products:', error);
        if (error.response?.status === 429) {
          console.warn('Rate limited - products request');
        }
        // Don't throw error for 401 on public endpoints
        if (error.response?.status === 401) {
          console.warn('401 on products - using empty array');
          return;
        }
      }
    }
  );

  const { data: recentItems = [], isLoading: loadingRecentItems } = useQuery(['recentItems'], () =>
    fetchRecentItems(),
    {
      retry: 1, // Reduced from 3 to 1
      retryDelay: 3000, // Increased from 2000 to 3000
      staleTime: 5 * 60 * 1000, // Increased from 2 minutes to 5 minutes
      cacheTime: 10 * 60 * 1000, // Added cache time
      onError: (error) => {
        console.error('Failed to fetch recent items:', error);
        if (error.response?.status === 429) {
          console.warn('Rate limited - recent items request');
        }
        // Don't throw error for 401 on public endpoints
        if (error.response?.status === 401) {
          console.warn('401 on recent items');
          return;
        }
      }
    }
  );



  const itemsToDisplay = searchQuery ? filteredItems : selectedSubcategory ? products : recentItems;

  // Show loading state when dealing with rate limiting
  const isRateLimited = rateLimitStatus.isRateLimited;

  // Filter search results without causing infinite re-renders
  const filteredItems = searchQuery
    ? recentItems.filter((item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    : recentItems;

  // Get search query from URL only when location changes
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const query = params.get("query") || "";
    setSearchQuery(query);
  }, [location.search]);

  return (
    <div className="w-full min-h-screen flex flex-col bg-gradient-to-br from-amber-600 via-orange-600 to-yellow-600">
      <Header />
      <div className="bg-white relative pt-16">
        <Carousel />
      </div>

      {/* Rate Limiting Notice */}
      {isRateLimited && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <strong>Rate Limited:</strong> We're experiencing high traffic.
                {rateLimitStatus.remainingTime > 0 && (
                  <span> Please wait {rateLimitStatus.remainingTime} seconds before trying again.</span>
                )}
                Some data may be loading slowly or showing fallback content.
              </p>
            </div>
          </div>
        </div>
      )}

      <main className="flex-grow bg-gradient-to-b from-gray-50 to-white py-12 px-6 sm:px-8 lg:px-12">

        {/* Products Section - New Design */}
        <section className="max-w-8xl mx-auto">
          <div className="flex flex-col xl:flex-row gap-12">
            {/* Floating Sidebar */}
            <div className={`w-full xl:w-96 ${isSidebarOpen ? 'block' : 'hidden xl:block'}`}>
              <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-amber-200/30 xl:sticky xl:top-8">
                <div className="flex items-center justify-between mb-10">
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                    Categories
                  </h2>
                  <button
                    onClick={() => setIsSidebarOpen(false)}
                    className="xl:hidden p-3 rounded-full bg-amber-100 text-amber-600 hover:bg-amber-200 transition-colors"
                  >
                    <FaBars size={18} />
                  </button>
                </div>

                {categoriesLoading ? (
                  <div className="flex items-center justify-center py-16">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-3 border-amber-600"></div>
                    <span className="ml-4 text-gray-600 text-lg">Loading...</span>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {categories.map((category) => {
                      const CategoryIcon = getCategoryIcon(category.category_name);
                      return (
                        <div key={category._id} className="mb-6">
                          <div
                            className="flex items-center justify-between w-full py-5 px-6 rounded-2xl cursor-pointer hover:bg-gradient-to-r hover:from-amber-50 hover:to-orange-50 text-gray-700 transition-all duration-400 group border border-transparent hover:border-amber-200 hover:shadow-lg"
                            onClick={() => {
                              setExpandedCategory(expandedCategory === category.category_name ? null : category.category_name);
                              setSelectedCategory(category.category_name);
                              setSelectedSubcategory('');
                            }}
                          >
                            <div className="flex items-center">
                              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center mr-5 group-hover:scale-110 transition-transform duration-300">
                                <CategoryIcon className="text-white text-lg" />
                              </div>
                              <span className="font-bold text-gray-800 text-lg">{category.category_name}</span>
                            </div>
                            {expandedCategory === category.category_name ?
                              <FaChevronUp className="text-amber-500 transition-transform text-lg" /> :
                              <FaChevronDown className="text-gray-400 group-hover:text-amber-500 transition-all duration-300 text-lg" />
                            }
                          </div>
                          {expandedCategory === category.category_name && (
                            <div className="ml-16 mt-4 space-y-3 animate-fadeIn">
                              {subcategoriesLoading ? (
                                <div className="flex items-center justify-center py-6">
                                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
                                </div>
                              ) : (
                                subcategories.map((subcategory) => (
                                  <button
                                    key={subcategory._id}
                                    className={`block w-full text-left py-4 px-6 rounded-xl transition-all duration-400 transform hover:scale-105 ${selectedSubcategory === subcategory.subcategory_name
                                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold shadow-xl'
                                      : 'hover:bg-amber-50 text-gray-600 hover:text-amber-700 hover:shadow-lg'
                                      }`}
                                    onClick={() => setSelectedSubcategory(subcategory.subcategory_name)}
                                  >
                                    {subcategory.subcategory_name}
                                  </button>
                                ))
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Products Content - New Design */}
            <div className="flex-1">
              {/* Floating Header with Search Results and Controls */}
              <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-10 mb-12 border border-amber-200/30">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
                  <div className="flex-1">
                    <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent mb-4">
                      {searchQuery
                        ? `Search Results for "${searchQuery}"`
                        : selectedSubcategory
                          ? `${selectedSubcategory} Products`
                          : "All Products"}
                    </h1>
                    <div className="flex items-center gap-6">
                      <p className="text-gray-600 text-xl">
                        {itemsToDisplay.length} {itemsToDisplay.length === 1 ? 'item' : 'items'} found
                      </p>
                      <div className="w-3 h-3 bg-amber-500 rounded-full animate-pulse"></div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <button
                      onClick={() => setIsListView(!isListView)}
                      className="p-5 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100 text-amber-600 hover:text-amber-700 transition-all duration-400 shadow-xl hover:shadow-2xl transform hover:scale-110"
                    >
                      {isListView ? <FaTh size={28} /> : <FaList size={28} />}
                    </button>
                    <button
                      onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                      className="xl:hidden p-5 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100 text-amber-600 hover:text-amber-700 transition-all duration-400 shadow-xl hover:shadow-2xl transform hover:scale-110"
                    >
                      <FaBars size={28} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Product Grid/List - New Design */}
              {(selectedSubcategory ? loadingProducts : loadingRecentItems) ? (
                <div className="flex justify-center items-center py-24">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-20 w-20 border-b-4 border-amber-600 mx-auto mb-6"></div>
                    <p className="text-gray-600 text-xl">Loading amazing products...</p>
                  </div>
                </div>
              ) : itemsToDisplay.length > 0 ? (
                <div className={`${isListView ? 'space-y-6' : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8'}`}>
                  {itemsToDisplay.map((item) => (
                    <div
                      key={item._id}
                      className={`group bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:scale-105 cursor-pointer overflow-hidden border border-amber-200/30 ${isListView ? 'flex items-center p-6' : 'p-5'
                        }`}
                      onClick={() => navigate(`/product/${item._id}`)}
                    >
                      <div className={`relative overflow-hidden rounded-xl ${isListView ? 'w-32 h-32 flex-shrink-0' : 'w-full h-48'}`}>
                        <img
                          src={`https://localhost:3000/item_images/${item.image}`}
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        <div className="absolute top-3 right-3 w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                          <span className="text-white text-xs font-bold">→</span>
                        </div>
                        <div className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform -translate-y-2 group-hover:translate-y-0">
                          <div className="px-2 py-1 bg-white/90 backdrop-blur-sm rounded-full">
                            <FaHeart className="text-amber-500 text-xs" />
                          </div>
                        </div>
                      </div>

                      <div className={`${isListView ? 'ml-6 flex-1' : 'mt-4'}`}>
                        <h3 className="text-lg font-bold text-gray-800 group-hover:text-amber-600 transition-colors mb-2 line-clamp-2">
                          {item.name}
                        </h3>
                        <p className="text-2xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent mb-3">
                          Rs {item.price}
                        </p>
                        <p className="text-sm text-gray-600 mb-4 line-clamp-2 leading-relaxed">
                          {item.description}
                        </p>
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-gray-500 font-medium">
                            Listed on: {new Date(item.date).toLocaleDateString()}
                          </p>
                          <div className="px-3 py-1 bg-gradient-to-r from-amber-100 to-orange-100 rounded-full group-hover:from-amber-200 group-hover:to-orange-200 transition-all duration-300">
                            <span className="text-xs font-semibold text-amber-700">View Details</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-24">
                  <div className="w-40 h-40 mx-auto mb-8 bg-gradient-to-br from-amber-100 to-orange-100 rounded-full flex items-center justify-center">
                    <FaTags className="text-5xl text-amber-500" />
                  </div>
                  <h3 className="text-3xl font-bold text-gray-800 mb-4">No products found</h3>
                  <p className="text-gray-600 text-xl">Try adjusting your search or browse different categories</p>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

export default Home;
