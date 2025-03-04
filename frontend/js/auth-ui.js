// This file handles updating the UI based on authentication status

function updateAuthUI() {
    const isLoggedIn = api.auth.isLoggedIn();
    const user = api.auth.getUser();
    
    // Get all elements that should show/hide based on auth status
    const loggedOutElements = document.querySelectorAll('.logged-out-only');
    const loggedInElements = document.querySelectorAll('.logged-in-only');
    const adminElements = document.querySelectorAll('.admin-only');
    const usernameElements = document.querySelectorAll('.username-display');
    
    if (isLoggedIn) {
      // User is logged in
      
      // Hide elements for logged out users
      loggedOutElements.forEach(element => {
        element.classList.add('d-none');
      });
      
      // Show elements for logged in users
      loggedInElements.forEach(element => {
        element.classList.remove('d-none');
      });
      
      // Display username
      usernameElements.forEach(element => {
        element.textContent = user.username;
      });
      
      // Show admin elements if user is admin
      if (api.auth.isAdmin()) {
        adminElements.forEach(element => {
          element.classList.remove('d-none');
        });
      } else {
        adminElements.forEach(element => {
          element.classList.add('d-none');
        });
      }
    } else {
      // User is logged out
      
      // Show elements for logged out users
      loggedOutElements.forEach(element => {
        element.classList.remove('d-none');
      });
      
      // Hide elements for logged in users
      loggedInElements.forEach(element => {
        element.classList.add('d-none');
      });
      
      // Hide admin elements
      adminElements.forEach(element => {
        element.classList.add('d-none');
      });
    }
  }
  
  // Set up logout functionality
  function setupLogout() {
    const logoutButtons = document.querySelectorAll('.logout-btn');
    
    logoutButtons.forEach(button => {
      button.addEventListener('click', function(e) {
        e.preventDefault();
        api.auth.logout();
      });
    });
  }
  
  // Run when the page loads
  document.addEventListener('DOMContentLoaded', function() {
    updateAuthUI();
    setupLogout();
  });