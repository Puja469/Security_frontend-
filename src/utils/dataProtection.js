// Data Protection and Privacy Utilities
import { decryptData, encryptData, generateSecureToken } from './security';

// GDPR Configuration
export const GDPR_CONFIG = {
  DATA_RETENTION_DAYS: 730, // 2 years
  ANONYMIZATION_THRESHOLD: 10, // Minimum users for anonymization
  CONSENT_REQUIRED: true,
  RIGHT_TO_BE_FORGOTTEN: true,
  DATA_EXPORT_ENABLED: true,
  COOKIE_CONSENT_REQUIRED: true,
  PRIVACY_MODE_ENABLED: true,
  DO_NOT_TRACK_RESPECT: true,
};

// Data Classification
export const DATA_CLASSIFICATION = {
  PUBLIC: 'public',
  INTERNAL: 'internal',
  CONFIDENTIAL: 'confidential',
  RESTRICTED: 'restricted',
  PERSONAL: 'personal',
  SENSITIVE: 'sensitive'
};

// Data Protection Utilities
export const DataProtection = {
  // Anonymize user data for analytics
  anonymizeUserData: (userData) => {
    const anonymized = {
      id: generateSecureToken(16),
      ageGroup: userData.age ? Math.floor(userData.age / 10) * 10 : null,
      location: userData.city ? userData.city.substring(0, 3) + '***' : null,
      preferences: userData.preferences ? Object.keys(userData.preferences).length : 0,
      activityLevel: userData.lastLogin ? 'active' : 'inactive',
      timestamp: new Date().toISOString()
    };
    return anonymized;
  },

  // Pseudonymize sensitive data
  pseudonymizeData: (data, salt = generateSecureToken(16)) => {
    const pseudonymized = {};
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'string' && value.length > 0) {
        pseudonymized[key] = generateSecureToken(8) + salt.substring(0, 8);
      } else {
        pseudonymized[key] = value;
      }
    }
    return { data: pseudonymized, salt };
  },

  // Depseudonymize data (requires salt)
  depseudonymizeData: (pseudonymizedData, salt) => {
    // This would typically involve a lookup table or database
    // For demo purposes, we'll return the original structure
    return pseudonymizedData;
  },

  // Check data retention policy
  checkDataRetention: (dataTimestamp) => {
    const retentionDate = new Date(dataTimestamp);
    retentionDate.setDate(retentionDate.getDate() + GDPR_CONFIG.DATA_RETENTION_DAYS);
    return new Date() > retentionDate;
  },

  // Clean expired data
  cleanExpiredData: (dataArray) => {
    return dataArray.filter(item => !DataProtection.checkDataRetention(item.timestamp));
  },

  // Export user data (GDPR right to data portability)
  exportUserData: (userId) => {
    const userData = {
      profile: JSON.parse(localStorage.getItem(`user_${userId}_profile`) || '{}'),
      activity: JSON.parse(localStorage.getItem(`user_${userId}_activity`) || '[]'),
      preferences: JSON.parse(localStorage.getItem(`user_${userId}_preferences`) || '{}'),
      products: JSON.parse(localStorage.getItem(`user_${userId}_products`) || '[]'),
      orders: JSON.parse(localStorage.getItem(`user_${userId}_orders`) || '[]'),
      exportDate: new Date().toISOString(),
      format: 'JSON'
    };
    return userData;
  },

  // Delete user data (GDPR right to be forgotten)
  deleteUserData: (userId) => {
    const keysToDelete = [
      `user_${userId}_profile`,
      `user_${userId}_activity`,
      `user_${userId}_preferences`,
      `user_${userId}_products`,
      `user_${userId}_orders`,
      `user_${userId}_sessions`,
      `user_${userId}_notifications`
    ];

    keysToDelete.forEach(key => {
      localStorage.removeItem(key);
    });

    return { success: true, deletedKeys: keysToDelete };
  },

  // Find all references to user data
  findUserReferences: (userId) => {
    const references = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.includes(userId.toString())) {
        references.push(key);
      }
    }
    return references;
  }
};

// Privacy Controls
export const PrivacyControls = {
  // Cookie consent management
  cookieConsent: {
    set: (consent) => {
      const consentData = {
        ...consent,
        timestamp: new Date().toISOString(),
        version: '1.0'
      };
      localStorage.setItem('cookieConsent', JSON.stringify(consentData));
    },

    get: () => {
      const consent = localStorage.getItem('cookieConsent');
      return consent ? JSON.parse(consent) : null;
    },

    has: (type) => {
      const consent = PrivacyControls.cookieConsent.get();
      return consent && consent[type] === true;
    },

    revoke: () => {
      localStorage.removeItem('cookieConsent');
    }
  },

  // Do Not Track detection
  doNotTrack: () => {
    return navigator.doNotTrack === '1' ||
      navigator.doNotTrack === 'yes' ||
      window.doNotTrack === '1' ||
      window.doNotTrack === 'yes';
  },

  // Privacy mode toggle
  privacyMode: {
    enable: () => {
      localStorage.setItem('privacyMode', 'enabled');
      // Disable analytics, tracking, etc.
      if (window.gtag) window.gtag('config', 'GA_MEASUREMENT_ID', { 'anonymize_ip': true });
    },

    disable: () => {
      localStorage.removeItem('privacyMode');
    },

    isEnabled: () => {
      return localStorage.getItem('privacyMode') === 'enabled';
    }
  },

  // Data minimization based on classification
  minimizeData: (data, classification) => {
    switch (classification) {
      case DATA_CLASSIFICATION.PUBLIC:
        return data;
      case DATA_CLASSIFICATION.INTERNAL:
        return { ...data, email: data.email ? data.email.substring(0, 3) + '***' : null };
      case DATA_CLASSIFICATION.CONFIDENTIAL:
        return { id: data.id, type: data.type, timestamp: data.timestamp };
      case DATA_CLASSIFICATION.RESTRICTED:
        return { id: data.id, timestamp: data.timestamp };
      case DATA_CLASSIFICATION.PERSONAL:
        return DataProtection.anonymizeUserData(data);
      case DATA_CLASSIFICATION.SENSITIVE:
        return { id: generateSecureToken(16), timestamp: data.timestamp };
      default:
        return data;
    }
  }
};

// Content Security
export const ContentSecurity = {
  // Profanity filter
  profanityFilter: {
    blockedWords: [
      'spam', 'scam', 'fake', 'fraud', 'hack', 'crack', 'virus', 'malware',
      'phishing', 'suspicious', 'illegal', 'unauthorized', 'forbidden'
    ],

    check: (text) => {
      const lowerText = text.toLowerCase();
      const foundWords = ContentSecurity.profanityFilter.blockedWords.filter(
        word => lowerText.includes(word)
      );
      return {
        hasProfanity: foundWords.length > 0,
        foundWords,
        score: foundWords.length / ContentSecurity.profanityFilter.blockedWords.length
      };
    },

    sanitize: (text) => {
      let sanitized = text;
      ContentSecurity.profanityFilter.blockedWords.forEach(word => {
        const regex = new RegExp(word, 'gi');
        sanitized = sanitized.replace(regex, '*'.repeat(word.length));
      });
      return sanitized;
    }
  },

  // Image validation
  imageValidation: {
    checkDimensions: (file) => {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          resolve({
            isValid: img.width >= 100 && img.height >= 100 && img.width <= 4000 && img.height <= 4000,
            width: img.width,
            height: img.height,
            aspectRatio: img.width / img.height
          });
        };
        img.src = URL.createObjectURL(file);
      });
    },

    checkAspectRatio: (width, height, minRatio = 0.5, maxRatio = 2.0) => {
      const ratio = width / height;
      return ratio >= minRatio && ratio <= maxRatio;
    }
  },

  // Spam detection
  spamDetection: {
    patterns: [
      /(buy|sell|cheap|discount|offer|deal|limited|urgent|act now|click here)/gi,
      /(http|www|\.com|\.net|\.org)/gi,
      /(\d{3,})/g, // Multiple consecutive digits
      /([A-Z]{5,})/g, // Multiple consecutive uppercase letters
      /(.)\1{4,}/g // Repeated characters
    ],

    score: (text) => {
      let score = 0;
      ContentSecurity.spamDetection.patterns.forEach(pattern => {
        const matches = text.match(pattern);
        if (matches) {
          score += matches.length * 0.1;
        }
      });
      return Math.min(score, 1.0);
    },

    isSpam: (text, threshold = 0.5) => {
      return ContentSecurity.spamDetection.score(text) >= threshold;
    }
  }
};

// Sensitive Data Encryption
export const SensitiveDataEncryption = {
  // Encrypt user data
  encryptUserData: (userData, key = process.env.REACT_APP_USER_DATA_KEY) => {
    const sensitiveFields = ['email', 'phone', 'address', 'paymentInfo', 'ssn', 'passport'];
    const encrypted = { ...userData };

    sensitiveFields.forEach(field => {
      if (encrypted[field]) {
        encrypted[field] = encryptData(encrypted[field], key);
      }
    });

    return encrypted;
  },

  // Decrypt user data
  decryptUserData: (encryptedData, key = process.env.REACT_APP_USER_DATA_KEY) => {
    const sensitiveFields = ['email', 'phone', 'address', 'paymentInfo', 'ssn', 'passport'];
    const decrypted = { ...encryptedData };

    sensitiveFields.forEach(field => {
      if (decrypted[field] && typeof decrypted[field] === 'string') {
        try {
          decrypted[field] = decryptData(decrypted[field], key);
        } catch (error) {
          console.warn(`Failed to decrypt field: ${field}`);
        }
      }
    });

    return decrypted;
  },

  // Encrypt messages
  encryptMessage: (message, recipientPublicKey) => {
    // This would typically use asymmetric encryption
    // For demo purposes, we'll use symmetric encryption
    return encryptData(message, recipientPublicKey);
  },

  // Decrypt messages
  decryptMessage: (encryptedMessage, privateKey) => {
    return decryptData(encryptedMessage, privateKey);
  }
};

// Privacy Analytics (Anonymized)
export const PrivacyAnalytics = {
  trackEvent: (eventName, eventData = {}) => {
    if (PrivacyControls.doNotTrack() || PrivacyControls.privacyMode.isEnabled()) {
      return null;
    }

    const consent = PrivacyControls.cookieConsent.get();
    if (!consent || !consent.analytics) {
      return null;
    }

    const anonymizedEvent = {
      event: eventName,
      timestamp: new Date().toISOString(),
      sessionId: generateSecureToken(16),
      userAgent: navigator.userAgent.substring(0, 50) + '...',
      ...DataProtection.anonymizeUserData(eventData)
    };

    // Store locally for privacy
    const analytics = JSON.parse(localStorage.getItem('privacyAnalytics') || '[]');
    analytics.push(anonymizedEvent);

    // Keep only last 100 events
    if (analytics.length > 100) {
      analytics.splice(0, analytics.length - 100);
    }

    localStorage.setItem('privacyAnalytics', JSON.stringify(analytics));
    return anonymizedEvent;
  },

  getAnalytics: () => {
    return JSON.parse(localStorage.getItem('privacyAnalytics') || '[]');
  },

  clearAnalytics: () => {
    localStorage.removeItem('privacyAnalytics');
  }
};

export default {
  GDPR_CONFIG,
  DATA_CLASSIFICATION,
  DataProtection,
  PrivacyControls,
  ContentSecurity,
  SensitiveDataEncryption,
  PrivacyAnalytics
}; 