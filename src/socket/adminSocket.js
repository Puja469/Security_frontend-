import io from 'socket.io-client';
import { getAdminToken } from '../services/adminApi';

class AdminSocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.listeners = new Map();
  }

  // Initialize WebSocket connection
  connect() {
    try {
      const token = getAdminToken();
      
      if (!token) {
        console.warn('⚠️ No admin token available for WebSocket connection');
        return;
      }

      // Create socket connection with admin authentication
      this.socket = io('https://localhost:3000', {
        auth: {
          token: token,
          role: 'admin'
        },
        transports: ['websocket', 'polling'],
        timeout: 20000,
        forceNew: true
      });

      this.setupEventListeners();
      console.log('🔌 Admin WebSocket connection initiated');
    } catch (error) {
      console.error('❌ Error connecting to admin WebSocket:', error);
    }
  }

  // Setup event listeners
  setupEventListeners() {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('✅ Admin WebSocket connected');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.emit('admin:join', { role: 'admin' });
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Admin WebSocket disconnected:', reason);
      this.isConnected = false;
      
      if (reason === 'io server disconnect') {
        // Server disconnected us, try to reconnect
        this.socket.connect();
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Admin WebSocket connection error:', error);
      this.isConnected = false;
      
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        console.log(`🔄 Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
        
        setTimeout(() => {
          this.connect();
        }, this.reconnectDelay * this.reconnectAttempts);
      } else {
        console.error('❌ Max reconnection attempts reached');
      }
    });

    // Admin-specific events
    this.socket.on('admin:dashboard:stats', (data) => {
      console.log('📊 Dashboard stats update received:', data);
      this.notifyListeners('dashboard:stats', data);
    });

    this.socket.on('admin:user:activity', (data) => {
      console.log('👤 User activity update received:', data);
      this.notifyListeners('user:activity', data);
    });

    this.socket.on('admin:user:blocked', (data) => {
      console.log('🚫 User blocked notification received:', data);
      this.notifyListeners('user:blocked', data);
    });

    this.socket.on('admin:user:unblocked', (data) => {
      console.log('✅ User unblocked notification received:', data);
      this.notifyListeners('user:unblocked', data);
    });

    this.socket.on('admin:security:alert', (data) => {
      console.log('🚨 Security alert received:', data);
      this.notifyListeners('security:alert', data);
    });

    this.socket.on('admin:system:notification', (data) => {
      console.log('🔔 System notification received:', data);
      this.notifyListeners('system:notification', data);
    });

    // Error handling
    this.socket.on('error', (error) => {
      console.error('❌ Admin WebSocket error:', error);
      this.notifyListeners('error', error);
    });
  }

  // Emit events to server
  emit(event, data) {
    if (this.socket && this.isConnected) {
      this.socket.emit(event, data);
      console.log(`📤 Admin WebSocket emit: ${event}`, data);
    } else {
      console.warn(`⚠️ Cannot emit ${event}: WebSocket not connected`);
    }
  }

  // Subscribe to events
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
    
    console.log(`📡 Admin WebSocket listener added for: ${event}`);
    
    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(event);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
          console.log(`📡 Admin WebSocket listener removed for: ${event}`);
        }
      }
    };
  }

  // Notify all listeners for an event
  notifyListeners(event, data) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`❌ Error in admin WebSocket listener for ${event}:`, error);
        }
      });
    }
  }

  // Request dashboard stats update
  requestDashboardStats() {
    this.emit('admin:dashboard:stats:request', {});
  }

  // Request user activity updates
  requestUserActivity(userId = null) {
    this.emit('admin:user:activity:request', { userId });
  }

  // Subscribe to specific user activity
  subscribeToUserActivity(userId) {
    this.emit('admin:user:activity:subscribe', { userId });
  }

  // Unsubscribe from specific user activity
  unsubscribeFromUserActivity(userId) {
    this.emit('admin:user:activity:unsubscribe', { userId });
  }

  // Get connection status
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      maxReconnectAttempts: this.maxReconnectAttempts
    };
  }

  // Disconnect WebSocket
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.listeners.clear();
      console.log('🔌 Admin WebSocket disconnected');
    }
  }

  // Reconnect WebSocket
  reconnect() {
    console.log('🔄 Reconnecting admin WebSocket...');
    this.disconnect();
    this.reconnectAttempts = 0;
    setTimeout(() => {
      this.connect();
    }, this.reconnectDelay);
  }
}

// Create singleton instance
const adminSocketService = new AdminSocketService();

export default adminSocketService; 