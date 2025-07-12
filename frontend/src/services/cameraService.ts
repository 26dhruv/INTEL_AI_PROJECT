import api from './api';

export interface CameraStatus {
  is_running: boolean;
  timestamp: string;
}

export const cameraService = {
  // Start camera monitoring
  async startCamera(): Promise<{ message: string }> {
    try {
      const response = await api.post('/camera/start');
      return response.data;
    } catch (error) {
      console.error('Error starting camera:', error);
      throw error;
    }
  },

  // Stop camera monitoring
  async stopCamera(): Promise<{ message: string }> {
    try {
      const response = await api.post('/camera/stop');
      return response.data;
    } catch (error) {
      console.error('Error stopping camera:', error);
      throw error;
    }
  },

  // Get camera status
  async getCameraStatus(): Promise<CameraStatus> {
    try {
      const response = await api.get('/camera/status');
      return response.data;
    } catch (error) {
      console.error('Error fetching camera status:', error);
      throw error;
    }
  },
}; 