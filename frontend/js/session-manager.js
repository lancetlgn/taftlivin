const SESSION_TIMEOUT = 30 * 60 * 1000; 
let timeoutId;
let lastActivity = Date.now();

// Initialize the session timeout functionality
function initSessionTimeout() {
  if (!api.auth.isLoggedIn()) return;
  
  // Reset the timer when there's user activity
  document.addEventListener('mousemove', resetTimer);
  document.addEventListener('mousedown', resetTimer);
  document.addEventListener('keypress', resetTimer);
  document.addEventListener('touchmove', resetTimer);
  document.addEventListener('scroll', resetTimer);
  
  // Start the timer
  startTimer();
}

// Reset the inactivity timer
function resetTimer() {
  lastActivity = Date.now();
  clearTimeout(timeoutId);
  startTimer();
}

// Start the inactivity timer
function startTimer() {
  timeoutId = setTimeout(logoutDueToInactivity, SESSION_TIMEOUT);
}

// Handle session timeout
function logoutDueToInactivity() {
  if (Date.now() - lastActivity >= SESSION_TIMEOUT) {
    // Clear user data
    api.auth.logout();
    
    // Show timeout message
    Swal.fire({
      title: 'Session Expired',
      text: 'Your session has expired due to inactivity. Please login again.',
      icon: 'info',
      confirmButtonColor: '#28a745'
    }).then(() => {
      // Redirect to login page
      const currentPath = window.location.pathname;
      const redirectPath = currentPath.includes('/pages/') ? 'signin.html' : 'pages/signin.html';
      window.location.href = redirectPath;
    });
  }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', initSessionTimeout);