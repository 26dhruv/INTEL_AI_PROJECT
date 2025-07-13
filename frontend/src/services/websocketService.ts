import { io, Socket } from 'socket.io-client';

export interface FaceDetectionEvent {
  employee_id: string;
  name: string;
  confidence: number;
  timestamp: string;
}

export interface SafetyEvent {
  employee_id: string;
  safety_status: 'compliant' | 'minor_violation' | 'major_violation' | 'critical';
  violations: string[];
  timestamp: string;
}

class WebSocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 5000; // 5 seconds

  connect(): void {
    if (this.socket?.connected) {
      console.log('WebSocket already connected');
      return;
    }

    const wsUrl = import.meta.env.VITE_WEBSOCKET_URL || (
      import.meta.env.MODE === 'production' 
        ? window.location.origin  // Production: Use current domain
        : 'http://localhost:5001'  // Development: Use localhost
    );
    
    console.log('🔄 Attempting to connect to WebSocket server:', wsUrl);
    console.log('🌍 Environment mode:', import.meta.env.MODE);
    console.log('🔧 VITE_WEBSOCKET_URL:', import.meta.env.VITE_WEBSOCKET_URL);
    
    this.socket = io(wsUrl, {
      transports: ['polling', 'websocket'], // Start with polling first
      timeout: 20000,
      reconnection: true,
      reconnectionDelay: this.reconnectInterval,
      reconnectionAttempts: this.maxReconnectAttempts,
      forceNew: true, // Force new connection
      upgrade: true, // Allow upgrade to websocket
      withCredentials: false, // Disable credentials for CORS
      autoConnect: true, // Auto connect on creation
    });

    this.setupEventListeners();
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('✅ Connected to WebSocket server');
      console.log('🔗 Connection ID:', this.socket?.id);
      console.log('🚀 Transport:', this.socket?.io.engine.transport.name);
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Disconnected from WebSocket server:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ WebSocket connection error:', error);
      console.error('Error message:', error.message);
      this.handleReconnection();
    });

    this.socket.on('connected', (data) => {
      console.log('📡 WebSocket handshake completed:', data?.message || data);
    });

    // Add transport event listeners for debugging
    this.socket.io.on('error', (error) => {
      console.error('❌ Socket.IO error:', error);
    });

    this.socket.io.engine.on('upgrade', () => {
      console.log('⬆️ Upgraded to transport:', this.socket?.io.engine.transport.name);
    });

    this.socket.io.engine.on('upgradeError', (error) => {
      console.error('❌ Upgrade error:', error);
    });
  }

  private handleReconnection(): void {
    this.reconnectAttempts++;
    
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ Max reconnection attempts reached');
      return;
    }

    console.log(`🔄 Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
  }

  // Event listeners
  onFaceDetected(callback: (event: FaceDetectionEvent) => void): void {
    this.socket?.on('face_detected', callback);
  }

  onSafetyEvent(callback: (event: SafetyEvent) => void): void {
    this.socket?.on('safety_event', callback);
  }

  // Remove event listeners
  offFaceDetected(callback?: (event: FaceDetectionEvent) => void): void {
    this.socket?.off('face_detected', callback);
  }

  offSafetyEvent(callback?: (event: SafetyEvent) => void): void {
    this.socket?.off('safety_event', callback);
  }

  // Get connection status
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // Emit events
  emit(event: string, data?: unknown): void {
    this.socket?.emit(event, data);
  }

  // Manual connection test
  testConnection(): Promise<boolean> {
    return new Promise((resolve) => {
      if (this.socket?.connected) {
        resolve(true);
        return;
      }

      // Disconnect existing connection
      this.disconnect();

      // Create new connection for testing
      const wsUrl = import.meta.env.VITE_WEBSOCKET_URL || 'http://localhost:5001';
      
      console.log('🧪 Testing WebSocket connection to:', wsUrl);
      
      const testSocket = io(wsUrl, {
        transports: ['polling', 'websocket'],
        timeout: 10000,
        reconnection: false,
        withCredentials: false,
        autoConnect: true,
      });

      const cleanup = () => {
        testSocket.disconnect();
      };

      testSocket.on('connect', () => {
        console.log('✅ WebSocket test connection successful');
        cleanup();
        resolve(true);
      });

      testSocket.on('connect_error', (error) => {
        console.error('❌ WebSocket test connection failed:', error.message);
        cleanup();
        resolve(false);
      });

      // Timeout after 10 seconds
      setTimeout(() => {
        console.error('❌ WebSocket test connection timeout');
        cleanup();
        resolve(false);
      }, 10000);
    });
  }
}

// Create singleton instance
export const websocketService = new WebSocketService();

// Auto-connect when service is imported with a small delay
setTimeout(() => {
  websocketService.connect();
}, 1000);

export default websocketService; 