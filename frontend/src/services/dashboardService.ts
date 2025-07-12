import api from './api';

export interface DashboardStats {
  total_employees: number;
  employees_present_today: number;
  safety_compliance_rate: number;
  active_monitoring: boolean;
  recent_attendance: number;
  recent_violations: number;
  system_status: {
    mongodb: boolean;
    face_recognition: boolean;
    safety_monitoring: boolean;
    camera: boolean;
  };
}

export interface Alert {
  id: string;
  type: 'safety' | 'attendance' | 'system';
  message: string;
  employee_id?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
}

export interface HealthStatus {
  status: string;
  timestamp: string;
  services: {
    mongodb: boolean;
    face_recognition: boolean;
    safety_monitoring: boolean;
  };
}

export const dashboardService = {
  // Get dashboard statistics
  async getDashboardStats(): Promise<DashboardStats> {
    try {
      const response = await api.get('/dashboard/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw error;
    }
  },

  // Get recent alerts
  async getRecentAlerts(): Promise<Alert[]> {
    try {
      const response = await api.get('/dashboard/recent-alerts');
      return response.data;
    } catch (error) {
      console.error('Error fetching recent alerts:', error);
      throw error;
    }
  },

  // Get system health status
  async getHealthStatus(): Promise<HealthStatus> {
    try {
      const response = await api.get('/health');
      return response.data;
    } catch (error) {
      console.error('Error fetching health status:', error);
      throw error;
    }
  },
}; 