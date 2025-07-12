import api from './api';

export interface SafetyEvent {
  _id?: string;
  employee_id: string;
  timestamp: string;
  safety_status: 'compliant' | 'minor_violation' | 'major_violation' | 'critical';
  violations: string[];
  ppe_detected: {
    helmet: boolean;
    safety_vest: boolean;
    safety_shoes: boolean;
    gloves: boolean;
  };
  severity: 'low' | 'medium' | 'high' | 'critical';
  created_at?: string;
}

export interface SafetyStats {
  total_events: number;
  compliance_rate: number;
  violation_rate: number;
  safety_score: number;
  ppe_compliance: {
    helmet: number;
    safety_vest: number;
    safety_shoes: number;
    gloves: number;
  };
  violation_types: Array<{
    type: string;
    count: number;
    percentage: number;
  }>;
  daily_stats: Array<{
    date: string;
    compliant: number;
    violations: number;
    compliance_rate: number;
  }>;
}

export const safetyService = {
  // Get safety events
  async getSafetyEvents(params?: {
    start_date?: string;
    end_date?: string;
    employee_id?: string;
  }): Promise<SafetyEvent[]> {
    try {
      const response = await api.get('/safety/events', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching safety events:', error);
      throw error;
    }
  },

  // Get safety statistics
  async getSafetyStats(params?: {
    start_date?: string;
    end_date?: string;
  }): Promise<SafetyStats> {
    try {
      const response = await api.get('/safety/stats', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching safety stats:', error);
      throw error;
    }
  },
}; 