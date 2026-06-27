import axios from 'axios';

// Create axios instance with interceptors for auth
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' }
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    // Try to get token from localStorage (for persistence)
    const storedAuth = localStorage.getItem('viettung-auth');
    if (storedAuth) {
      try {
        const { state } = JSON.parse(storedAuth);
        if (state?.token) {
          config.headers.Authorization = `Bearer ${state.token}`;
        }
      } catch (e) {
        // Ignore parse errors
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear auth on unauthorized
      localStorage.removeItem('viettung-auth');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Default export
export default apiClient;
