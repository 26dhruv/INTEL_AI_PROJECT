import api from './api';

export interface Employee {
  _id?: string;
  employee_id: string;
  name: string;
  department: string;
  position: string;
  email: string;
  phone?: string;
  hire_date?: string;
  status: 'active' | 'inactive';
  created_at?: string;
  updated_at?: string;
}

export interface EmployeeRegistrationData extends Omit<Employee, '_id' | 'status' | 'created_at' | 'updated_at'> {
  face_image?: string; // Base64 encoded image
}

export const employeeService = {
  // Get all employees
  async getAllEmployees(): Promise<Employee[]> {
    try {
      const response = await api.get('/employees');
      return response.data || [];
    } catch (error) {
      console.error('Error fetching employees:', error);
      throw error;
    }
  },

  // Get employee by ID
  async getEmployeeById(employeeId: string): Promise<Employee> {
    try {
      const response = await api.get(`/employees/${employeeId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching employee:', error);
      throw error;
    }
  },

  // Register new employee
  async registerEmployee(data: EmployeeRegistrationData): Promise<{ message: string; employee_id: string }> {
    try {
      // Validate required fields
      const requiredFields = ['employee_id', 'name', 'department', 'position', 'email'];
      for (const field of requiredFields) {
        if (!data[field as keyof EmployeeRegistrationData]) {
          throw new Error(`Missing required field: ${field}`);
        }
      }

      // Clean up the data
      const cleanData = {
        employee_id: data.employee_id.trim(),
        name: data.name.trim(),
        department: data.department.trim(),
        position: data.position.trim(),
        email: data.email.trim().toLowerCase(),
        phone: data.phone?.trim() || '',
        ...(data.face_image && { face_image: data.face_image })
      };

      console.log('Registering employee with data:', { ...cleanData, face_image: data.face_image ? '[IMAGE_DATA]' : 'none' });
      
      const response = await api.post('/employees', cleanData);
      console.log('Employee registration response:', response.data);
      
      return response.data;
    } catch (error) {
      console.error('Error registering employee:', error);
      throw error;
    }
  },

  // Update employee
  async updateEmployee(employeeId: string, data: Partial<Employee>): Promise<{ message: string }> {
    try {
      // Clean up the data
      const cleanData = {
        ...(data.name && { name: data.name.trim() }),
        ...(data.department && { department: data.department.trim() }),
        ...(data.position && { position: data.position.trim() }),
        ...(data.email && { email: data.email.trim().toLowerCase() }),
        ...(data.phone && { phone: data.phone.trim() }),
      };

      const response = await api.put(`/employees/${employeeId}`, cleanData);
      return response.data;
    } catch (error) {
      console.error('Error updating employee:', error);
      throw error;
    }
  },

  // Delete employee
  async deleteEmployee(employeeId: string): Promise<{ message: string }> {
    try {
      const response = await api.delete(`/employees/${employeeId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting employee:', error);
      throw error;
    }
  },

  // Check if employee ID is available
  async checkEmployeeIdAvailable(employeeId: string): Promise<boolean> {
    try {
      await this.getEmployeeById(employeeId);
      return false; // If we get here, employee exists
    } catch (error) {
      // If we get a 404, employee doesn't exist, so ID is available
      if (error && typeof error === 'object' && 'response' in error) {
        const httpError = error as { response?: { status?: number } };
        if (httpError.response?.status === 404) {
          return true;
        }
      }
      throw error;
    }
  }
}; 