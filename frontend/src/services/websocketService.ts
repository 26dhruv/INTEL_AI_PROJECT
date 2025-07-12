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
      return;
    }

    const wsUrl = import.meta.env.VITE_WS_URL || 'http://localhost:5001';
    
    this.socket = io(wsUrl, {
      transports: ['websocket', 'polling'],
      timeout: 20000,
      reconnection: true,
      reconnectionDelay: this.reconnectInterval,
      reconnectionAttempts: this.maxReconnectAttempts,
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
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Disconnected from WebSocket server:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ WebSocket connection error:', error);
      this.handleReconnection();
    });

    this.socket.on('connected', (data) => {
      console.log('📡 WebSocket handshake completed:', data.message);
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
}

// Create singleton instance
export const websocketService = new WebSocketService();

// Auto-connect when service is imported
websocketService.connect();

export default websocketService; 