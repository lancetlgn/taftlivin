/**
 * TaftLivin Authentication UI Handler
 * Manages all UI elements related to authentication state
 */

// Update all UI elements based on authentication status
function updateAuthUI() {
    const isLoggedIn = api.auth.isLoggedIn();
    const user = isLoggedIn ? api.auth.getUser() : null;
    const isAdmin = isLoggedIn && api.auth.isAdmin();
    
    // Get all relevant UI elements
    const loggedOutElements = document.querySelectorAll('.logged-out-only');
    const loggedInElements = document.querySelectorAll('.logged-in-only');
    const adminElements = document.querySelectorAll('.admin-only');
    const usernameElements = document.querySelectorAll('.username-display');
    
    // Review-specific elements
    const reviewAuthButtons = document.getElementById('review-auth-buttons');
    const reviewLoggedInUser = document.getElementById('review-logged-in-user');
    
    if (isLoggedIn) {
      // User is logged in
      
      // Update username displays
      usernameElements.forEach(el => {
        el.textContent = user.username;
      });
      
      // Show logged-in elements, hide logged-out elements
      loggedInElements.forEach(el => el.classList.remove('d-none'));
      loggedOutElements.forEach(el => el.classList.add('d-none'));
      
      // Handle review form access
      if (reviewAuthButtons && reviewLoggedInUser) {
        reviewAuthButtons.classList.add('d-none');
        reviewLoggedInUser.classList.remove('d-none');
      }
      
      // Show admin elements if user is admin
      if (isAdmin) {
        adminElements.forEach(el => el.classList.remove('d-none'));
      } else {
        adminElements.forEach(el => el.classList.add('d-none'));
      }
      
    } else {
      // User is logged out
      
      // Show logged-out elements, hide logged-in elements
      loggedOutElements.forEach(el => el.classList.remove('d-none'));
      loggedInElements.forEach(el => el.classList.add('d-none'));
      adminElements.forEach(el => el.classList.add('d-none'));
      
      // Handle review form access
      if (reviewAuthButtons && reviewLoggedInUser) {
        reviewAuthButtons.classList.remove('d-none');
        reviewLoggedInUser.classList.add('d-none');
      }
    }
  }
  
  // Set up logout functionality
  function setupLogoutButtons() {
    const logoutButtons = document.querySelectorAll('.logout-btn');
    
    logoutButtons.forEach(button => {
      button.addEventListener('click', function(e) {
        e.preventDefault();
        
        // Call the logout function from API
        api.auth.logout();
        
        // Update UI immediately
        updateAuthUI();
        
        // Determine correct path for redirect based on current location
        const currentPath = window.location.pathname;
        let redirectPath;
        
        // If we're in a sub-page (contains "/pages/"), go back to main index
        if (currentPath.includes('/pages/')) {
          redirectPath = '../index.html';
        } else {
          // Already on main page or unknown location
          redirectPath = 'index.html';
        }
        
        // Redirect to homepage
        window.location.href = redirectPath;
      });
    });
  }
  
  // Protect page if authentication is required
  function protectPage(redirectTo = '/pages/signin.html') {
    if (!api.auth.isLoggedIn()) {
      // Save the current page URL so we can redirect back after login
      sessionStorage.setItem('redirectAfterLogin', window.location.pathname);
      window.location.href = redirectTo;
      return false;
    }
    return true;
  }
  
  // Protect admin page
  function protectAdminPage(redirectTo = '/index.html') {
    if (!api.auth.isLoggedIn() || !api.auth.isAdmin()) {
      window.location.href = redirectTo;
      return false;
    }
    return true;
  }
  
  // Handle redirect after login if needed
  function handlePostLoginRedirect() {
    const redirectPath = sessionStorage.getItem('redirectAfterLogin');
    if (redirectPath) {
      sessionStorage.removeItem('redirectAfterLogin');
      window.location.href = redirectPath;
      return true;
    }
    return false;
  }
  
  // Initialize auth UI
  document.addEventListener('DOMContentLoaded', function() {
    // Remove any mock authentication
    localStorage.removeItem('mockLoggedIn');
    localStorage.removeItem('mockAdminLoggedIn');
    
    updateAuthUI();
    setupLogoutButtons();
  });