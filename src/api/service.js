import api from "./axios";

const authService = {
  
    createser: async (userData) => {
      try {
        const response = await api.post('admin/create-user', userData);
        return response.data;
      } catch (error) {
        if (error.response) {
          // The server responded with a status code outside the 2xx range
          throw error.response.data;
        } else if (error.request) {
          // The request was made but no response was received
          throw { error: 'No response from server. Please check your connection.' };
        } else {
          // Something happened in setting up the request
          throw { error: 'Failed to send request. Please try again.' };
        }
      }
    },
  
  
    login: async (credentials) => {
      try {
        const response = await api.post('login', credentials); 
        // If login is successful, store the token
        if (response.data.access_token && response.data.user) {
           localStorage.setItem('AuthToken', response.data.access_token);
           localStorage.setItem('Ruser', JSON.stringify(response.data.user)); 
        }
        
        return response.data;
      } catch (error) {
        if (error.response) {
          throw error.response.data;
        } else if (error.request) {
          throw { error: 'No response from server. Please check your connection.' };
        } else {
          throw { error: 'Failed to send request. Please try again.' };
        }
      }
    },
  
    getLogs: async () => {
      try {
        const response = await api.get('logs'); 
        return response.data;
      } catch (error) {
        if (error.response) {
          throw error.response.data;
        } else if (error.request) {
          throw { error: 'No response from server. Please check your connection.' };
        } else {
          throw { error: 'Failed to send request. Please try again.' };
        }
      }
    },
    getAllUsers: async () => {
      try {
        const response = await api.get('admin/users'); 
        return response.data;
      } catch (error) {
        if (error.response) {
          throw error.response.data;
        } else if (error.request) {
          throw { error: 'No response from server. Please check your connection.' };
        } else {
          throw { error: 'Failed to send request. Please try again.' };
        }
      }
    },
  

    enableMFA: async (data) => {
      try {
        const response = await api.post('/user/create-mfa-pin',data);
        return response.data;
      } catch (error) {
        if (error.response) {
          throw error.response.data;
        } else if (error.request) {
          throw { error: 'No response from server. Please check your connection.' };
        } else {
          throw { error: 'Failed to send request. Please try again.' };
        }
      }
    },
    changePassword: async (data) => {
      try {
        const response = await api.post('/user/update-passwrod',data);
        return response.data;
      } catch (error) {
        if (error.response) {
          throw error.response.data;
        } else if (error.request) {
          throw { error: 'No response from server. Please check your connection.' };
        } else {
          throw { error: 'Failed to send request. Please try again.' };
        }
      }
    },

    getUser: async () => {
      try {
        const response = await api.get('user/profile');
        return response.data;
      } catch (error) {
        if (error.response) {
          throw error.response.data;
        } else if (error.request) {
          throw { error: 'No response from server. Please check your connection.' };
        } else {
          throw { error: 'Failed to send request. Please try again.' };
        }
      }
    },
    getUserRole: async () => {
      try {
        const response = await api.get('user/roles');
        return response.data;
      } catch (error) {
        if (error.response) {
          throw error.response.data;
        } else if (error.request) {
          throw { error: 'No response from server. Please check your connection.' };
        } else {
          throw { error: 'Failed to send request. Please try again.' };
        }
      }
    },
    assignUserRole: async (data) => {
      try {
        const response = await api.post('admin/assign-role', data);
        return response.data;
      } catch (error) {
        if (error.response) {
          throw error.response.data;
        } else if (error.request) {
          throw { error: 'No response from server. Please check your connection.' };
        } else {
          throw { error: 'Failed to send request. Please try again.' };
        }
      }
    },

    updateProfile: async (payload) => {
      try {
        const response = await api.post('user/update-profile', payload);
        return response.data;
      } catch (error) {
        if (error.response) {
          throw error.response.data;
        } else if (error.request) {
          throw { error: 'No response from server. Please check your connection.' };
        } else {
          throw { error: 'Failed to send request. Please try again.' };
        }
      }
    },
  
    
    logout: () => {
      localStorage.removeItem('AuthToken');
      localStorage.removeItem('Ruser');
    },
  
    // Check if user is logged in
    isAuthenticated: () => {
      return localStorage.getItem('AuthToken') !== null;
    },
  
    // Get current user data
    getCurrentUser: () => {
      const user = localStorage.getItem('Ruser');
      return user ? JSON.parse(user) : null;
    }
  };
  
  export { api, authService };