const API_URL = 'http://localhost:8000/api';

const auth = {
    // Register a new user
    register: async (userData) => {
      try {
        const response = await fetch(`${API_URL}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(userData)
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.message || 'Registration failed');
        }
        
        // Save token and user data
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify({
          _id: data._id,
          username: data.username,
          email: data.email,
          userType: data.userType
        }));
        
        return data;
      } catch (error) {
        console.error('Register error:', error);
        throw error;
      }
    },
    
    // Login user
    login: async (credentials) => {
      try {
        const response = await fetch(`${API_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(credentials)
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.message || 'Login failed');
        }
        
        // Save token and user data
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify({
          _id: data._id,
          username: data.username,
          email: data.email,
          userType: data.userType
        }));
        
        return data;
      } catch (error) {
        console.error('Login error:', error);
        throw error;
      }
    },
    
    // Verify if token is still valid (useful for session checking)
    verifyToken: async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return false;
        
        const response = await fetch(`${API_URL}/auth/verify`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        return response.ok;
      } catch (error) {
        console.error('Token verification error:', error);
        return false;
      }
    },
    
    // Logout user
    logout: () => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    },
    
    // Check if user is logged in
    isLoggedIn: () => {
      return localStorage.getItem('token') !== null;
    },
    
    // Get current user
    getUser: () => {
      const user = localStorage.getItem('user');
      return user ? JSON.parse(user) : null;
    },
    
    // Check if user is admin
    isAdmin: () => {
      const user = auth.getUser();
      return user && user.userType === 'admin';
    }
  };


  // Add this code before the window.api line:

// Admin API functions
const admin = {
    // Get all users
    getUsers: async (page = 1, search = '') => {
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Not authenticated');
        
        let url = `${API_URL}/admin/users?page=${page}`;
        if (search) url += `&search=${encodeURIComponent(search)}`;
        
        const response = await fetch(url, {
          headers: { 
            'Authorization': `Bearer ${token}` 
          }
        });
        
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || 'Failed to fetch users');
        }
        
        return data;
      } catch (error) {
        console.error('Error fetching users:', error);
        throw error;
      }
    },
    
    // Update a user
    updateUser: async (userId, userData) => {
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Not authenticated');
        
        const response = await fetch(`${API_URL}/admin/users/${userId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(userData)
        });
        
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || 'Failed to update user');
        }
        
        return data;
      } catch (error) {
        console.error('Error updating user:', error);
        throw error;
      }
    },
    
    // Delete a user
    deleteUser: async (userId) => {
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Not authenticated');
        
        const response = await fetch(`${API_URL}/admin/users/${userId}`, {
          method: 'DELETE',
          headers: { 
            'Authorization': `Bearer ${token}` 
          }
        });
        
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || 'Failed to delete user');
        }
        
        return data;
      } catch (error) {
        console.error('Error deleting user:', error);
        throw error;
      }
    },
    
    // Get dashboard stats
    getStats: async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Not authenticated');
        
        const response = await fetch(`${API_URL}/admin/stats`, {
          headers: { 
            'Authorization': `Bearer ${token}` 
          }
        });
        
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || 'Failed to fetch stats');
        }
        
        return data;
      } catch (error) {
        console.error('Error fetching stats:', error);
        throw error;
      }
    }
  };

    // Change password
    changePassword: async (passwordData) => {
        try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Not authenticated');
        
        const response = await fetch(`${API_URL}/users/change-password`, {
            method: 'POST',
            headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(passwordData)
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Failed to change password');
        }
        
        return data;
        } catch (error) {
        console.error('Password change error:', error);
        throw error;
        }
    }
  
  window.api = { 
    API_URL, 
    auth, 
    admin 
  };