// Client/register.js

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
      document.querySelectorAll('.login_button').forEach(btn => btn.style.display = 'none');
      document.querySelectorAll('.register_button').forEach(btn => btn.style.display = 'none');
      document.querySelectorAll('#logout-button').forEach(btn => btn.style.display = 'block');

      if (user.role === 'professor') {
        document.querySelectorAll('#create-opportunity-button').forEach(btn => btn.style.display = 'block');
      }
    } else {
      // User is not logged in
      document.querySelectorAll('.login_button').forEach(btn => btn.style.display = 'block');
      document.querySelectorAll('.register_button').forEach(btn => btn.style.display = 'block');
      document.querySelectorAll('#logout-button').forEach(btn => btn.style.display = 'none');
      document.querySelectorAll('#create-opportunity-button').forEach(btn => btn.style.display = 'none');
    }
  }

  displayUserUI(); // Call on page load

  // Logout Function
  window.logout = function () {
    localStorage.removeItem('token');
    alert('Logged out successfully!');
    window.location.href = 'researchIndex.html';
  };

  // Registration Function
  window.register = async function () {
    const username = document.getElementById('register-username').value.trim();
    const email = document.getElementById('register-email').value.trim();
    const password = document.getElementById('register-password').value;
    const role = document.getElementById('register-role').value;

    const registerMessage = document.getElementById('register-message');
    registerMessage.innerHTML = '';

    // Basic client-side validation
    if (!username || !email || !password || !role) {
      registerMessage.innerHTML = '<p class="error">All fields are required.</p>';
      return;
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      registerMessage.innerHTML = '<p class="error">Please enter a valid email address.</p>';
      return;
    }

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, email, password, role })
      });

      const data = await response.json();

      if (response.ok) {
        registerMessage.innerHTML = '<p class="success">Registration successful! Redirecting to login...</p>';
        // Redirect to login page after successful registration
        setTimeout(() => {
          window.location.href = 'login.html';
        }, 2000);
      } else {
        registerMessage.innerHTML = `<p class="error">${data.message}</p>`;
      }
    } catch (error) {
      console.error('Error during registration:', error);
      registerMessage.innerHTML = '<p class="error">An error occurred. Please try again later.</p>';
    }
  };
});

document.addEventListener('DOMContentLoaded', function () {
  const recommendedButton = document.querySelector('.researchOpportunities');

  // Hide Dropdown Menu if user is not logged in
  const user = getUserFromToken();
  if (!user) {
    const dropdownMenu = document.getElementById('dropdown-menu');
    if (dropdownMenu) {
      dropdownMenu.style.display = 'none';
    }
  } else {
    // Show Dropdown Menu if user is student or professor
    if (user.role === 'student' || user.role === 'professor') {
      const dropdownMenu = document.getElementById('dropdown-menu');
      if (dropdownMenu) {
        dropdownMenu.style.display = 'block';
      }

      // Show the appropriate "My Applications" link based on role
      if (user.role === 'student') {
        const studentApplicationsLink = document.getElementById('student-applications-link');
        if (studentApplicationsLink) {
          studentApplicationsLink.style.display = 'block';
        }
      }

      if (user.role === 'professor') {
        const professorApplicationsLink = document.getElementById('professor-applications-link');
        if (professorApplicationsLink) {
          professorApplicationsLink.style.display = 'block';
        }
      }
    } else {
      // If user has a role other than student or professor, hide the dropdown
      const dropdownMenu = document.getElementById('dropdown-menu');
      if (dropdownMenu) {
        dropdownMenu.style.display = 'none';
      }
    }
  }

  // Hide Recommended Opportunities button if user is not a student
  if (!user || user.role !== 'student') {
    const recommendedButton = document.getElementById('recommended-opportunities-button');
    if (recommendedButton) {
      recommendedButton.style.display = 'none';
    }
  }

  // Hide "My Applications" links if user does not have the respective role
  if (!user || user.role !== 'student') {
    const studentApplicationsLink = document.getElementById('student-applications-link');
    if (studentApplicationsLink) {
      studentApplicationsLink.style.display = 'none';
    }
  }

  if (!user || user.role !== 'professor') {
    const professorApplicationsLink = document.getElementById('professor-applications-link');
    if (professorApplicationsLink) {
      professorApplicationsLink.style.display = 'none';
    }
  }

  // *** Optional: Show Logout and Hide Login Buttons if User is Logged In ***
  if (user) {
    const logoutButton = document.querySelector('.logout_button');
    const loginButton = document.querySelector('.login_button');
    if (logoutButton) {
      logoutButton.style.display = 'inline-block';
    }
    if (loginButton && !loginButton.classList.contains('logout_button')) { // Ensure not to hide the logout button
      loginButton.style.display = 'none';
    }
  }

  function getUserFromToken() {
    const token = localStorage.getItem('token');
    if (!token) return null;

    try {
      const payload = token.split('.')[1];
      const decodedPayload = JSON.parse(atob(payload));
      return decodedPayload;
    } catch (e) {
      console.error('Error decoding token:', e);
      return null;
    }
  }
});
