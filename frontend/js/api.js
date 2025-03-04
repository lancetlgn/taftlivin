const API_URL = 'http://localhost:8000/api';

// Auth API functions
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
      
      // Save token to localStorage
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data));
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
      
      // Save token to localStorage
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data));
      return data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },
  
  // Logout user
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
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


// Add these admin functions after your existing auth functions

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
  

  //global API object
  window.api = { auth, admin };