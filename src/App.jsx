import { lazy, Suspense, useContext } from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import CSRFProtection from "./components/CSRFProtection.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import { useAuth } from "./context/AuthContext.jsx";
import { RateLimitProvider } from "./context/RateLimitContext";
import { ThemeContext } from "./context/ThemeContext";

// Lazy load components
const Home = lazy(() => import("./core/public/home.jsx"));
const Register = lazy(() => import("./core/public/register"));
const ProductDetails = lazy(() => import("./core/public/ProductDetails"));
const Category = lazy(() => import("./core/public/pages/Category.jsx"));

// Security components
const SecurityDashboard = lazy(() => import("./components/SecurityDashboard.jsx"));
const PrivacySettings = lazy(() => import("./components/PrivacySettings.jsx"));
const SecurityAudit = lazy(() => import("./components/SecurityAudit.jsx"));
const SecurityAlert = lazy(() => import("./components/SecurityAlert.jsx"));

// Admin components
const Layout = lazy(() => import("./core/private/admin/Layout.jsx"));
const Dashboard = lazy(() => import("./core/private/admin/dashboard/dashboard.jsx"));
const AdminLogin = lazy(() => import("./core/private/admin/auth/adminLogin.jsx"));
const UserManagement = lazy(() => import("./core/private/admin/userManagement/index.jsx"));
const UserForm = lazy(() => import("./core/private/admin/userManagement/Form.jsx"));
const UserTable = lazy(() => import("./core/private/admin/userManagement/Table.jsx"));
const ProductManagement = lazy(() => import("./core/private/admin/productManagement/index.jsx"));
const ProductTable = lazy(() => import("./core/private/admin/productManagement/Table.jsx"));
const ProductDetail = lazy(() => import("./core/private/admin/productManagement/Details.jsx"));
const ProductActions = lazy(() => import("./core/private/admin/productManagement/Actions.jsx"));

// User components
const MyAccount = lazy(() => import("./core/private/users/MyAccount/index.jsx"));
const AddProductForm = lazy(() => import("./core/private/users/MyAccount/form.jsx"));
const ProfileImage = lazy(() => import("./core/private/users/MyAccount/ProfileImage.jsx"));

function App() {
  const { isLoggedIn, role } = useAuth();
  // Ensure role has a default value if user is logged in
  const userRole = isLoggedIn && !role ? "user" : role;
  const isAdmin = isLoggedIn && userRole === "admin";
  const isUser = isLoggedIn && userRole === "user";

  console.log("🔒 App.js Security Debug:");
  console.log("isLoggedIn:", isLoggedIn);
  console.log("role:", role);
  console.log("userRole:", userRole);
  console.log("isAdmin:", isAdmin);
  console.log("isUser:", isUser);

  const { darkMode } = useContext(ThemeContext);

  // Public routes - accessible to everyone
  const publicRoutes = [
    {
      path: "/",
      element: (
        <Suspense fallback={
          <div className="min-h-screen bg-gradient-to-br from-amber-600 via-orange-600 to-yellow-600 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-white text-xl font-semibold">Loading amazing home page...</p>
            </div>
          </div>
        }>
          <Home />
        </Suspense>
      ),
    },
    {
      path: "/register",
      element: (
        <Suspense fallback={
          <div className="min-h-screen bg-gradient-to-br from-amber-600 via-orange-600 to-yellow-600 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-white text-xl font-semibold">Loading registration...</p>
            </div>
          </div>
        }>
          <Register />
        </Suspense>
      ),
    },
    {
      path: "/product/:id",
      element: (
        <Suspense fallback={
          <div className="min-h-screen bg-gradient-to-br from-amber-600 via-orange-600 to-yellow-600 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-white text-xl font-semibold">Loading product details...</p>
            </div>
          </div>
        }>
          <ProductDetails />
        </Suspense>
      ),
    },
    {
      path: "/category",
      element: (
        <Suspense fallback={
          <div className="min-h-screen bg-gradient-to-br from-amber-600 via-orange-600 to-yellow-600 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-white text-xl font-semibold">Loading categories...</p>
            </div>
          </div>
        }>
          <Category />
        </Suspense>
      ),
    },
    {
      path: "/admin/login",
      element: (
        <Suspense fallback={
          <div className="min-h-screen bg-gradient-to-br from-amber-600 via-orange-600 to-yellow-600 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-white text-xl font-semibold">Loading admin login...</p>
            </div>
          </div>
        }>
          <AdminLogin />
        </Suspense>
      ),
    },
    {
      path: "/security-alert",
      element: (
        <Suspense fallback={
          <div className="min-h-screen bg-gradient-to-br from-red-600 via-red-700 to-red-800 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-white text-xl font-semibold">Loading security alert...</p>
            </div>
          </div>
        }>
          <SecurityAlert />
        </Suspense>
      ),
    },
  ];

  // User routes - protected, requires user authentication
  const userRoutes = [
    {
      path: "/my-account",
      element: (
        <ProtectedRoute requiredRole="user">
          <Suspense fallback={
            <div className="min-h-screen bg-gradient-to-br from-amber-600 via-orange-600 to-yellow-600 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-white text-xl font-semibold">Loading your account...</p>
              </div>
            </div>
          }>
            <MyAccount />
          </Suspense>
        </ProtectedRoute>
      ),
      children: [
        {
          path: "add-product",
          element: (
            <ProtectedRoute requiredRole="user">
              <Suspense fallback={
                <div className="min-h-screen bg-gradient-to-br from-amber-600 via-orange-600 to-yellow-600 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-white text-xl font-semibold">Loading product form...</p>
                  </div>
                </div>
              }>
                <AddProductForm />
              </Suspense>
            </ProtectedRoute>
          ),
        },
        {
          path: "profile-image",
          element: (
            <ProtectedRoute requiredRole="user">
              <Suspense fallback={
                <div className="min-h-screen bg-gradient-to-br from-amber-600 via-orange-600 to-yellow-600 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-white text-xl font-semibold">Loading profile...</p>
                  </div>
                </div>
              }>
                <ProfileImage />
              </Suspense>
            </ProtectedRoute>
          ),
        },
      ],
    },
    // Security routes
    {
      path: "/security",
      element: (
        <ProtectedRoute requiredRole="user">
          <Suspense fallback={
            <div className="min-h-screen bg-gradient-to-br from-amber-600 via-orange-600 to-yellow-600 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-white text-xl font-semibold">Loading security dashboard...</p>
              </div>
            </div>
          }>
            <SecurityDashboard />
          </Suspense>
        </ProtectedRoute>
      ),
    },
    {
      path: "/privacy",
      element: (
        <ProtectedRoute requiredRole="user">
          <Suspense fallback={
            <div className="min-h-screen bg-gradient-to-br from-amber-600 via-orange-600 to-yellow-600 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-white text-xl font-semibold">Loading privacy settings...</p>
              </div>
            </div>
          }>
            <PrivacySettings />
          </Suspense>
        </ProtectedRoute>
      ),
    },
    {
      path: "/security-audit",
      element: (
        <ProtectedRoute requiredRole="user">
          <Suspense fallback={
            <div className="min-h-screen bg-gradient-to-br from-amber-600 via-orange-600 to-yellow-600 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-white text-xl font-semibold">Loading security audit...</p>
              </div>
            </div>
          }>
            <SecurityAudit />
          </Suspense>
        </ProtectedRoute>
      ),
    },
  ];

  // Admin routes - protected, requires admin authentication
  const adminRoutes = [
    {
      path: "/admin",
      element: (
        <ProtectedRoute requiredRole="admin">
          <Suspense fallback={
            <div className="min-h-screen bg-gradient-to-br from-amber-600 via-orange-600 to-yellow-600 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-white text-xl font-semibold">Loading admin panel...</p>
              </div>
            </div>
          }>
            <Layout />
          </Suspense>
        </ProtectedRoute>
      ),
      children: [
        {
          path: "/admin/dashboard",
          element: (
            <ProtectedRoute requiredRole="admin">
              <Suspense fallback={
                <div className="min-h-screen bg-gradient-to-br from-amber-600 via-orange-600 to-yellow-600 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-white text-xl font-semibold">Loading dashboard...</p>
                  </div>
                </div>
              }>
                <Dashboard />
              </Suspense>
            </ProtectedRoute>
          ),
        },
        {
          path: "/admin/users",
          element: (
            <ProtectedRoute requiredRole="admin">
              <Suspense fallback={
                <div className="min-h-screen bg-gradient-to-br from-amber-600 via-orange-600 to-yellow-600 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-white text-xl font-semibold">Loading user management...</p>
                  </div>
                </div>
              }>
                <UserManagement />
              </Suspense>
            </ProtectedRoute>
          ),
          children: [
            {
              path: "table",
              element: (
                <ProtectedRoute requiredRole="admin">
                  <Suspense fallback={
                    <div className="min-h-screen bg-gradient-to-br from-amber-600 via-orange-600 to-yellow-600 flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-white text-xl font-semibold">Loading user table...</p>
                      </div>
                    </div>
                  }>
                    <UserTable />
                  </Suspense>
                </ProtectedRoute>
              ),
            },
            {
              path: "form/:id?",
              element: (
                <ProtectedRoute requiredRole="admin">
                  <Suspense fallback={
                    <div className="min-h-screen bg-gradient-to-br from-amber-600 via-orange-600 to-yellow-600 flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-white text-xl font-semibold">Loading user form...</p>
                      </div>
                    </div>
                  }>
                    <UserForm />
                  </Suspense>
                </ProtectedRoute>
              ),
            },
          ],
        },
        {
          path: "/admin/products",
          element: (
            <ProtectedRoute requiredRole="admin">
              <Suspense fallback={
                <div className="min-h-screen bg-gradient-to-br from-amber-600 via-orange-600 to-yellow-600 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-white text-xl font-semibold">Loading product management...</p>
                  </div>
                </div>
              }>
                <ProductManagement />
              </Suspense>
            </ProtectedRoute>
          ),
          children: [
            {
              path: "table",
              element: (
                <ProtectedRoute requiredRole="admin">
                  <Suspense fallback={
                    <div className="min-h-screen bg-gradient-to-br from-amber-600 via-orange-600 to-yellow-600 flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-white text-xl font-semibold">Loading product table...</p>
                      </div>
                    </div>
                  }>
                    <ProductTable />
                  </Suspense>
                </ProtectedRoute>
              ),
            },
            {
              path: "details/:id",
              element: (
                <ProtectedRoute requiredRole="admin">
                  <Suspense fallback={
                    <div className="min-h-screen bg-gradient-to-br from-amber-600 via-orange-600 to-yellow-600 flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-white text-xl font-semibold">Loading product details...</p>
                      </div>
                    </div>
                  }>
                    <ProductDetail />
                  </Suspense>
                </ProtectedRoute>
              ),
            },
            {
              path: "actions/:id",
              element: (
                <ProtectedRoute requiredRole="admin">
                  <Suspense fallback={
                    <div className="min-h-screen bg-gradient-to-br from-amber-600 via-orange-600 to-yellow-600 flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-white text-xl font-semibold">Loading product actions...</p>
                      </div>
                    </div>
                  }>
                    <ProductActions />
                  </Suspense>
                </ProtectedRoute>
              ),
            },
          ],
        },
      ],
    },
  ];

  // Combine routes based on authentication status
  const routes = [
    ...publicRoutes,
    ...(isUser ? userRoutes : []),
    ...(isAdmin ? adminRoutes : []),
    {
      path: "*",
      element: (
        <div className="min-h-screen bg-gradient-to-br from-amber-600 via-orange-600 to-yellow-600 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-white mb-4">404 - Page Not Found</h1>
            <p className="text-white text-xl">The page you're looking for doesn't exist.</p>
          </div>
        </div>
      ),
    },
  ];

  console.log("🔒 App.js Routing Security:");
  console.log("Public routes:", publicRoutes.length);
  console.log("User routes:", isUser ? userRoutes.length : 0);
  console.log("Admin routes:", isAdmin ? adminRoutes.length : 0);
  console.log("Total routes:", routes.length);

  return (
    <ErrorBoundary>
      <RateLimitProvider>
        <CSRFProtection showStatus={process.env.NODE_ENV === 'development'}>
          <div className={`min-h-screen ${darkMode ? "bg-gray-900 text-white" : "bg-white text-gray-900"} transition-all duration-300`}>
            <RouterProvider router={createBrowserRouter(routes)} />
          </div>
        </CSRFProtection>
      </RateLimitProvider>
    </ErrorBoundary>
  );
}

export default App;
