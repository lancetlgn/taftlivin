window.API_URL = window.API_URL || 'https://taftlivin-api.onrender.com/api';
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
    
    // Check if user is admin
    isAdmin: () => {
      const user = auth.getUser();
      return user && user.userType === 'admin';
    },
    
    // Get current user
    getUser: () => {
      const user = localStorage.getItem('user');
      return user ? JSON.parse(user) : null;
    },
    
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
    },
    
    // Update user profile
    updateProfile: async (profileData) => {
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Not authenticated');
        
        const response = await fetch(`${API_URL}/users/profile`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(profileData)
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.message || 'Failed to update profile');
        }
        
        // Update local storage user data
        const user = auth.getUser();
        if (user && profileData.bio) {
          user.bio = profileData.bio;
          localStorage.setItem('user', JSON.stringify(user));
        }
        
        return data;
      } catch (error) {
        console.error('Profile update error:', error);
        throw error;
      }
    }
};

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
    },

    // Create new user
    createUser: async (userData) => {
        try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Not authenticated');
        
        const response = await fetch(`${API_URL}/admin/users`, {
            method: 'POST',
            headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(userData)
        });
        
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Failed to create user');
        }
        
        return data;
        } catch (error) {
        console.error('Error creating user:', error);
        throw error;
        }
    },

    // Get all condos for admin
    getCondos: async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Not authenticated');
        
        const response = await fetch(`${API_URL}/admin/condos`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || 'Failed to fetch condos');
        }
        
        return data;
      } catch (error) {
        console.error('Error fetching condos:', error);
        throw error;
      }
    },
    
    // Get single condo
    getCondo: async (condoId) => {
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Not authenticated');
        
        const response = await fetch(`${API_URL}/admin/condos/${condoId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || 'Failed to fetch condo');
        }
        
        return data;
      } catch (error) {
        console.error('Error fetching condo:', error);
        throw error;
      }
    },
    
    // Create new condo
    createCondo: async (condoData) => {
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Not authenticated');
        
        const response = await fetch(`${API_URL}/admin/condos`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(condoData)
        });
        
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || 'Failed to create condo');
        }
        
        return data;
      } catch (error) {
        console.error('Error creating condo:', error);
        throw error;
      }
    },
    
    // Update condo
    updateCondo: async (condoId, condoData) => {
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Not authenticated');
        
        const response = await fetch(`${API_URL}/admin/condos/${condoId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(condoData)
        });
        
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || 'Failed to update condo');
        }
        
        return data;
      } catch (error) {
        console.error('Error updating condo:', error);
        throw error;
      }
    },
    
    // Delete condo
    deleteCondo: async (condoId) => {
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Not authenticated');
        
        const response = await fetch(`${API_URL}/admin/condos/${condoId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || 'Failed to delete condo');
        }
        
        return data;
      } catch (error) {
        console.error('Error deleting condo:', error);
        throw error;
      }
    }
};

// Export the API
window.api = { 
  API_URL, 
  auth, 
  admin, 

  getPopularCondos: async () => {
    try {
      const response = await fetch(`${API_URL}/condos/popular`);
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to fetch popular condos');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching popular condos:', error);
      throw error;
    }
  }
};