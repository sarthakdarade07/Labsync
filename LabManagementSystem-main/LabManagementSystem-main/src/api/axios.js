import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8080/api', // Backend base URL
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper to get cookie
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
}

// Add a request interceptor to attach JWT token if it exists
api.interceptors.request.use(
  (config) => {
    const token = getCookie('lms_token') || localStorage.getItem('lms_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle errors globally 
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      // Handle unauthorized errors (e.g. clear local storage and redirect to login)
      document.cookie = 'lms_token=; Max-Age=0; path=/;';
      localStorage.removeItem('lms_token');
      localStorage.removeItem('lms_user');
      window.location.href = '/LabManagementSystem/login';
    }
    return Promise.reject(error);
  }
);

export default api;
