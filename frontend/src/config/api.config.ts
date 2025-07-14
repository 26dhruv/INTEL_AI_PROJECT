// API Configuration for different environments
export const API_CONFIG = {
  // Development environment
  development: {
    baseURL: 'http://localhost:5001/api',
    timeout: 30000,
  },
  
  // Production environment - Update this URL after Render deployment
  production: {
    baseURL: 'https://your-render-service-name.onrender.com/api', // UPDATE THIS
    timeout: 30000,
  },
  
  // Staging environment (if needed)
  staging: {
    baseURL: 'https://your-staging-url.com/api',
    timeout: 30000,
  }
};

// Get current environment
export const getCurrentEnvironment = () => {
  return import.meta.env.MODE || 'development';
};

// Get API config for current environment
export const getApiConfig = () => {
  const env = getCurrentEnvironment();
  return API_CONFIG[env as keyof typeof API_CONFIG] || API_CONFIG.development;
};

// Export the base URL for easy access
export const API_BASE_URL = getApiConfig().baseURL; 