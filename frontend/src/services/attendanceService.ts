import api from './api';

export interface AttendanceRecord {
  _id?: string;
  employee_id: string;
  timestamp: string;
  confidence: number;
  face_detected: boolean;
  created_at?: string;
}

export interface AttendanceStats {
  total_records: number;
  unique_employees: number;
  attendance_rate: number;
  daily_stats: Array<{
    date: string;
    count: number;
    unique_employees: number;
  }>;
}

// Helper function for retry logic
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: unknown) {
      if (i === maxRetries - 1) throw error;
      
      // Only retry on timeout or connection errors
      const axiosError = error as { code?: string };
      if (axiosError.code === 'ECONNABORTED' || axiosError.code === 'NETWORK_ERROR') {
        console.log(`Attempt ${i + 1} failed, retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // Exponential backoff
      } else {
        throw error; // Don't retry on other errors
      }
    }
  }
  throw new Error('Max retries exceeded');
}

export const attendanceService = {
  // Get attendance records
  async getAttendanceRecords(params?: {
    start_date?: string;
    end_date?: string;
    employee_id?: string;
  }): Promise<AttendanceRecord[]> {
    try {
      const response = await withRetry(() => 
        api.get('/attendance', { 
          params,
          timeout: 30000 // Increase timeout to 30 seconds
        })
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching attendance records:', error);
      throw error;
    }
  },

  // Get attendance statistics
  async getAttendanceStats(params?: {
    start_date?: string;
    end_date?: string;
  }): Promise<AttendanceStats> {
    try {
      console.log('Fetching attendance stats with params:', params);
      const response = await withRetry(() => 
        api.get('/attendance/stats', { 
          params,
          timeout: 30000 // Increase timeout to 30 seconds
        })
      );
      console.log('Successfully fetched attendance stats:', response.data);
      return response.data;
    } catch (error: unknown) {
      console.error('Error fetching attendance stats:', error);
      const axiosError = error as { message?: string; code?: string; response?: { status?: number; data?: unknown } };
      console.error('Error details:', {
        message: axiosError.message,
        code: axiosError.code,
        status: axiosError.response?.status,
        data: axiosError.response?.data
      });
      throw error;
    }
  },

  // Mark daily attendance (for real-time face detection)
  async markAttendance(employee_id: string, confidence: number = 1.0): Promise<boolean> {
    try {
      const response = await api.post('/attendance/mark', {
        employee_id,
        timestamp: new Date().toISOString(),
        confidence,
        face_detected: true,
        method: 'face_recognition'
      });
      return response.status === 200 || response.status === 201;
    } catch (error) {
      console.error('Error marking attendance:', error);
      // Don't throw error - attendance marking should be non-blocking
      return false;
    }
  },

  // Check if employee already marked attendance today
  async checkTodayAttendance(employee_id: string): Promise<boolean> {
    try {
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
      const response = await api.get('/attendance/check-today', {
        params: { employee_id, date: today }
      });
      return response.data.hasAttendance || false;
    } catch (error) {
      console.warn('Error checking today attendance:', error);
      // Return false if we can't check - allow marking attendance
      return false;
    }
  }
}; 