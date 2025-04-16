import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
//   headers: {
//     'Content-Type': 'application/json',
//   },
});

// Add token to each request if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('AuthToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

    // Set content type based on data
    if (config.data instanceof FormData) {
        config.headers['Content-Type'] = 'multipart/form-data';
    } else if (typeof config.data === 'string') {
        config.headers['Content-Type'] = 'application/x-www-form-urlencoded';
    } else {
        config.headers['Content-Type'] = 'application/json';
    }
    
  return config;
});


export default api;