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

export const attendanceService = {
  // Get attendance records
  async getAttendanceRecords(params?: {
    start_date?: string;
    end_date?: string;
    employee_id?: string;
  }): Promise<AttendanceRecord[]> {
    try {
      const response = await api.get('/attendance', { params });
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
      const response = await api.get('/attendance/stats', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching attendance stats:', error);
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