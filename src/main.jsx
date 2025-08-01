import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRoot } from 'react-dom/client';
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import App from './App.jsx';
import ErrorBoundary from './components/ErrorBoundary';
import { AuthProvider } from "./context/AuthContext";
import { InfoProvider } from './context/InfoContext';
import { NotificationProvider } from "./context/NotificationContext.jsx";
import { ThemeProvider } from './context/ThemeContext';
import './index.css';
import { initializeSecurity } from './utils/securityInit';

// Initialize security features
initializeSecurity();

// Import security test utility (only in development)
if (process.env.NODE_ENV === 'development') {
  import('./utils/securityTest').then(({ runSecurityTests }) => {
    // Run security tests after a delay to ensure everything is loaded
    setTimeout(() => {
      console.log('🔍 Running security tests in development mode...');
      runSecurityTests();
    }, 3000);
  }).catch(error => {
    console.warn('⚠️ Could not load security test utility:', error);
  });

  // Import debug utility (only in development) - TEMPORARILY DISABLED
  // import('./utils/debugApi').then(({ runAllDebugTests }) => {
  //   // Run debug tests after a delay to ensure everything is loaded
  //   setTimeout(() => {
  //     console.log('🔍 Running API debug tests...');
  //     runAllDebugTests();
  //   }, 5000);
  // }).catch(error => {
  //   console.warn('⚠️ Could not load debug utility:', error);
  // });
}

const queryClient = new QueryClient();

const Providers = ({ children }) => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <InfoProvider>
          <NotificationProvider>
            {children}
          </NotificationProvider>
        </InfoProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <Providers>
      <ToastContainer theme="dark" />
      <App />
    </Providers>
  </ErrorBoundary>
);
