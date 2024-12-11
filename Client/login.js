// Client/login.js

document.addEventListener('DOMContentLoaded', function () {
  // Function to get user info from token
  function getUserFromToken() {
    const token = localStorage.getItem('token');
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload; // { userId, role, iat, exp }
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }

  // Function to display user-specific UI elements
  function displayUserUI() {
    const user = getUserFromToken();
    if (user) {
      // User is logged in
      document.querySelectorAll('.login_and_cart .login_button').forEach(btn => btn.style.display = 'none');
      document.querySelectorAll('.login_and_cart .register_button').forEach(btn => btn.style.display = 'none');
      document.querySelectorAll('.login_and_cart #logout-button').forEach(btn => btn.style.display = 'block');

      if (user.role === 'professor') {
        document.querySelectorAll('.login_and_cart #create-opportunity-button').forEach(btn => btn.style.display = 'block');
      }
    } else {
      // User is not logged in
      document.querySelectorAll('.login_and_cart .login_button').forEach(btn => btn.style.display = 'block');
      document.querySelectorAll('.login_and_cart .register_button').forEach(btn => btn.style.display = 'block');
      document.querySelectorAll('.login_and_cart #logout-button').forEach(btn => btn.style.display = 'none');
      document.querySelectorAll('.login_and_cart #create-opportunity-button').forEach(btn => btn.style.display = 'none');
    }
  }

  displayUserUI(); // Call on page load

  // Logout Function
  window.logout = function () {
    localStorage.removeItem('token');
    alert('Logged out successfully!');
    window.location.href = 'index.html';
  };

  // Login Function
  window.login = async function () {
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;

    const loginMessage = document.getElementById('login-message');
    loginMessage.innerHTML = '';

    if (!username || !password) {
      loginMessage.innerHTML = '<p class="error">Both fields are required.</p>';
      return;
    }

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (response.ok) {
        // Store token (use localStorage for simplicity; consider more secure methods)
        localStorage.setItem('token', data.token);
        loginMessage.innerHTML = '<p class="success">Login successful! Redirecting...</p>';

        // Redirect to home page after successful login
        setTimeout(() => {
          window.location.href = 'researchIndex.html';
        }, 1500);
      } else {
        loginMessage.innerHTML = `<p class="error">${data.message}</p>`;
      }
    } catch (error) {
      console.error('Error during login:', error);
      loginMessage.innerHTML = '<p class="error">An error occurred. Please try again later.</p>';
    }
  };

  // Hide Dropdown Menu if user is not logged in
  const user = getUserFromToken();
  if (!user) {
    const dropdownMenu = document.getElementById('dropdown-menu');
    if (dropdownMenu) {
      dropdownMenu.style.display = 'none';
    }
  } else {
    if (user.role !== 'student' && user.role !== 'professor') {
      // If user has a role other than student or professor, hide the dropdown
      const dropdownMenu = document.getElementById('dropdown-menu');
      if (dropdownMenu) {
        dropdownMenu.style.display = 'none';
      }
    }
  }

  if (!user || user.role !== 'student') {
    const recommendedButton = document.getElementById('recommended-opportunities-button');
    if (recommendedButton) {
      recommendedButton.style.display = 'none';
    }
  }

  if (!user || user.role !== 'professor') {
    const myApplicationsLink = document.getElementById('my-applications-link');
    if (myApplicationsLink) {
      myApplicationsLink.style.display = 'none';
    }
  }
});
