import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { checkRateLimitStatus } from '../services/apiServices';

const RateLimitContext = createContext();

export const useRateLimit = () => {
  const context = useContext(RateLimitContext);
  if (!context) {
    throw new Error('useRateLimit must be used within a RateLimitProvider');
  }
  return context;
};

export const RateLimitProvider = ({ children }) => {
  const [rateLimitStatus, setRateLimitStatus] = useState({
    isRateLimited: false,
    remainingTime: 0
  });

  // Memoize the check function to prevent unnecessary re-renders
  const checkStatus = useCallback(() => {
    const status = checkRateLimitStatus();
    setRateLimitStatus(prevStatus => {
      // Only update if the status has actually changed
      if (prevStatus.isRateLimited !== status.isRateLimited ||
        prevStatus.remainingTime !== status.remainingTime) {
        return status;
      }
      return prevStatus;
    });
  }, []);

  // Check rate limit status every second
  useEffect(() => {
    const interval = setInterval(checkStatus, 1000);

    return () => clearInterval(interval);
  }, [checkStatus]);

  const value = {
    rateLimitStatus,
    setRateLimitStatus
  };

  return (
    <RateLimitContext.Provider value={value}>
      {children}
    </RateLimitContext.Provider>
  );
}; 